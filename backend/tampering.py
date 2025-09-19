import os
import cv2
import numpy as np
from PIL import Image
import io
import easyocr
import csv
import exifread
import logging
from scipy import ndimage  # For advanced filtering if needed

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'])

def is_webp_file(image_path):
    """Check if a file is WebP by content, not just extension."""
    try:
        with Image.open(image_path) as img:
            return img.format.lower() == 'webp'
    except Exception:
        return False

def preprocess_image(image_path):
    """Enhanced preprocessing: grayscale, denoise, threshold, deskew, enhance contrast."""
    try:
        img = cv2.imread(image_path)
        if img is None:
            logging.error(f"Failed to load image: {image_path}")
            return None, None, None
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Enhance contrast with CLAHE
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        
        # Denoise using Non-local Means (better than Gaussian for documents)
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Adaptive thresholding for binary version
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Upscale for better OCR and analysis
        scale_percent = 200
        width = int(gray.shape[1] * scale_percent / 100)
        height = int(gray.shape[0] * scale_percent / 100)
        gray_resized = cv2.resize(gray, (width, height), interpolation=cv2.INTER_CUBIC)
        thresh_resized = cv2.resize(thresh, (width, height), interpolation=cv2.INTER_CUBIC)
        img_resized = cv2.resize(img, (width, height), interpolation=cv2.INTER_CUBIC)
        
        # Deskew using contours
        coords = np.column_stack(np.where(thresh_resized > 0))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            (h, w) = gray_resized.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            gray_deskewed = cv2.warpAffine(gray_resized, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            thresh_deskewed = cv2.warpAffine(thresh_resized, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            img_deskewed = cv2.warpAffine(img_resized, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        else:
            gray_deskewed, thresh_deskewed, img_deskewed = gray_resized, thresh_resized, img_resized
        
        return thresh_deskewed, gray_deskewed, img_deskewed
    except Exception as e:
        logging.error(f"Error preprocessing {image_path}: {str(e)}")
        return None, None, None

def detect_empty_table_cells(gray, thresh):
    """Detect table cells and check for empty ones using line detection and OCR."""
    try:
        h_img, w_img = gray.shape
        # Detect horizontal lines
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w_img // 20, 1))
        detect_horizontal = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
        horizontal_cnts, _ = cv2.findContours(detect_horizontal, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Detect vertical lines
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, h_img // 20))
        detect_vertical = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
        vertical_cnts, _ = cv2.findContours(detect_vertical, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Draw lines to form table grid
        table_img = np.zeros((h_img, w_img), dtype=np.uint8)
        for cnt in horizontal_cnts:
            x, y, w, hh = cv2.boundingRect(cnt)
            if hh > h_img // 50:  # Significant height
                cv2.drawContours(table_img, [cnt], -1, 255, 2)
        for cnt in vertical_cnts:
            x, y, w, hh = cv2.boundingRect(cnt)
            if w > w_img // 50:  # Significant width
                cv2.drawContours(table_img, [cnt], -1, 255, 2)
        
        # Find cell bounding boxes by intersections or contours
        contours, _ = cv2.findContours(table_img, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        cells = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if w > w_img // 20 and h > h_img // 50 and w < w_img // 2 and h < h_img // 5:  # Reasonable cell size
                cells.append((x, y, w, h))
        
        # Remove overlapping cells (simple non-max suppression)
        cells = sorted(cells, key=lambda c: c[2]*c[3], reverse=True)
        kept_cells = []
        for cell in cells:
            if not any(overlap(cell, kept) > 0.5 * cell[2]*cell[3] for kept in kept_cells):
                kept_cells.append(cell)
        
        def overlap(c1, c2):
            x1, y1, w1, h1 = c1
            x2, y2, w2, h2 = c2
            dx = max(0, min(x1+w1, x2+w2) - max(x1, x2))
            dy = max(0, min(y1+h1, y2+h2) - max(y1, y2))
            return dx * dy
        
        empty_cells = 0
        total_cells = len(kept_cells)
        for x, y, w, h in kept_cells:
            # Skip border cells (likely headers/footers)
            if y < h_img * 0.15 or y + h > h_img * 0.85:
                continue
            cell_patch = gray[y:y+h, x:x+w]
            if cell_patch.size == 0:
                continue
            ocr_res = reader.readtext(cell_patch, detail=0)  # Get texts only
            if not ocr_res or all(not t.strip() or len(t) < 1 for t in ocr_res):  # Empty or no meaningful text
                empty_cells += 1
        
        return empty_cells, total_cells
    except Exception as e:
        logging.error(f"Error detecting table cells: {str(e)}")
        return 0, 0

def detect_tampering(image_path):
    """Advanced tampering detection with table empty cell detection for erasures."""
    try:
        thresh, gray, color_img = preprocess_image(image_path)
        if thresh is None or gray is None or color_img is None:
            logging.error(f"Failed to load image for tampering detection: {image_path}")
            return "Error loading image"
        
        tampering_score = 0
        evidence = []
        filename = os.path.basename(image_path).lower()
        is_compressed = 'whatsapp' in filename or image_path.lower().endswith('.jpg')
        
        # 1. Metadata Check for Editing Software
        metadata_evidence = "No EXIF data"
        if not (is_webp_file(image_path) or image_path.lower().endswith('.png')):
            try:
                with open(image_path, 'rb') as f:
                    tags = exifread.process_file(f)
                    software = tags.get('Image Software', '')
                    if software:
                        software_lower = str(software).lower()
                        editing_tools = ['photoshop', 'gimp', 'paint', 'adobe', 'corel', 'illustrator']
                        if any(tool in software_lower for tool in editing_tools):
                            tampering_score += 20
                            metadata_evidence = f"Editing software detected: {software}"
                        else:
                            metadata_evidence = f"Software: {software} (non-suspicious)"
                    else:
                        metadata_evidence = "No software tag"
            except Exception as e:
                logging.info(f"EXIF read error: {str(e)}")
        evidence.append(metadata_evidence)
        
        # 2. Improved Error Level Analysis (ELA) using PIL
        try:
            original = Image.open(image_path).convert('RGB')
            buffer = io.BytesIO()
            original.save(buffer, 'JPEG', quality=90)
            resaved = Image.open(buffer)
            diff = np.abs(np.array(original, dtype=np.int16) - np.array(resaved, dtype=np.int16))
            scale = 10
            ela_image = np.clip(diff * scale, 0, 255).astype(np.uint8)
            ela_gray = cv2.cvtColor(ela_image, cv2.COLOR_RGB2GRAY)
            ela_gray = cv2.equalizeHist(ela_gray)
            ela_score = np.mean(ela_gray)
            if ela_score > 45:  # Raised threshold to reduce false positives on compressed images
                tampering_score += 25
                evidence.append(f"High ELA score: {ela_score:.2f} (compression inconsistencies)")
            else:
                evidence.append(f"Normal ELA: {ela_score:.2f}")
        except Exception as e:
            evidence.append(f"ELA error: {str(e)}")
        
        # 3. Enhanced Noise Variance Analysis (smaller patches for better local detection)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        h, w = gray.shape
        patch_size = 10  # Smaller for finer detection
        step = 5
        local_vars = []
        for y in range(0, h - patch_size, step):
            for x in range(0, w - patch_size, step):
                patch = laplacian[y:y+patch_size, x:x+patch_size]
                local_vars.append(np.var(patch))
        if local_vars:
            var_mean = np.mean(local_vars)
            var_std = np.std(local_vars)
            low_outliers = sum(1 for v in local_vars if v < var_mean - 3 * var_std)  # Focus on low var (smooth areas)
            if low_outliers / len(local_vars) > 0.05:  # 5% low var patches
                tampering_score += 20
                evidence.append("Low variance patches (possible local smoothing/edits)")
            else:
                evidence.append("Consistent noise variance")
        
        # 4. DCT: Disabled/conditioned to avoid false positives on compressed docs
        # (From research, low HF suspicious, but set very low threshold and condition on ELA)
        try:
            imf = np.float32(gray) / 255.0
            dct = cv2.dct(imf)
            hf_size = h // 4
            high_freq = dct[:hf_size, -hf_size:]
            hf_energy = np.mean(np.abs(high_freq))
            if hf_energy < 0.005 and ela_score < 30:  # Very low + low ELA indicates edit, not just compression
                tampering_score += 15
                evidence.append("Very low high-frequency energy in DCT (possible smoothing)")
            else:
                evidence.append(f"Normal HF energy: {hf_energy:.4f}")
        except Exception as e:
            evidence.append(f"DCT error: {str(e)}")
        
        # 5. Edge Detection for Erasures (tightened)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (h * w)
        text_regions = reader.readtext(gray, detail=1, paragraph=False)
        if len(text_regions) > 0:
            text_area = sum((bb[2][0] - bb[0][0]) * (bb[2][1] - bb[0][1]) for bb, _, conf in text_regions if conf > 0.5)
            text_ratio = text_area / (h * w)
            if edge_density < 0.015 * text_ratio:  # Further tightened
                tampering_score += 15
                evidence.append("Low edge density in text areas (possible erasures)")
            else:
                evidence.append("Normal edge density")
            
            # 6. Text Region Variance Check
            low_var_regions = 0
            for bb, text, conf in text_regions:
                if conf > 0.5 and text.strip():
                    x1, y1 = int(bb[0][0]), int(bb[0][1])
                    x2, y2 = int(bb[2][0]), int(bb[2][1])
                    if x2 > x1 and y2 > y1:
                        patch = gray[y1:y2, x1:x2]
                        if patch.size > 0:
                            patch_var = np.var(patch)
                            if patch_var < 12:  # Slightly lowered
                                low_var_regions += 1
            if low_var_regions > 1:
                tampering_score += 10 * low_var_regions
                evidence.append(f"Low variance in {low_var_regions} text regions (inpainting)")
        else:
            evidence.append("No text detected")
        
        # 7. Table Empty Cells Detection (key for field erasures)
        empty_cells, total_cells = detect_empty_table_cells(gray, thresh)
        if empty_cells >= 2:
            tampering_score += 35  # High weight for multiple empty fields
            evidence.append(f"Multiple empty table cells: {empty_cells}/{total_cells} (field erasures suspected)")
        elif empty_cells == 1:
            tampering_score += 10
            evidence.append(f"Single empty table cell: {empty_cells}/{total_cells}")
        else:
            evidence.append(f"No empty table cells ({empty_cells}/{total_cells})")
        
        # 8. Structural Text Analysis (tightened, only if enough regions)
        if len(text_regions) >= 5:  # More regions needed
            y_coords = [(bb[0][1] + bb[2][1]) / 2 for bb, _, _ in text_regions if _ > 0.5]
            widths = [bb[2][0] - bb[0][0] for bb, _, _ in text_regions if _ > 0.5]
            confs = [conf for _, _, conf in text_regions if conf > 0.5]
            if len(y_coords) > 2:
                y_diffs = np.diff(np.sort(y_coords))
                y_diffs_smooth = ndimage.median_filter(y_diffs, size=3) if len(y_diffs) > 2 else y_diffs
                if np.std(y_diffs_smooth) > 25:  # Tightened
                    tampering_score += 8
                    evidence.append("Irregular line spacing (text addition)")
            if len(widths) > 2 and np.std(widths) > 30:  # Tightened
                tampering_score += 8
                evidence.append("Inconsistent character widths (font mismatch)")
            if len(confs) > 2 and np.std(confs) > 0.20:  # Tightened
                tampering_score += 5
                evidence.append("High variable OCR confidence (possible changes)")
        
        # 9. Text Coverage Check (flag if very low)
        if len(text_regions) > 0:
            text_area = sum((bb[2][0] - bb[0][0]) * (bb[2][1] - bb[0][1]) for bb, _, conf in text_regions if conf > 0.5)
            text_coverage = text_area / (h * w)
            if text_coverage < 0.025:  # Lowered threshold
                tampering_score += 15
                evidence.append(f"Low text coverage: {text_coverage:.3f} (possible erasures)")
            else:
                evidence.append(f"Text coverage: {text_coverage:.3f}")
        
        # Decision based on trust score
        trust_score = 100 - tampering_score
        if trust_score > 90:
            status = "authentic certificate"
            return f"{status} (Score: {trust_score}/100)"
        else:
            status = "suspicious"
            details = "; ".join(evidence)
            logging.info(f"Tampering analysis for {image_path}: {status} (Score: {trust_score}/100) - {details}")
            return f"{status} (Score: {trust_score}/100) - {details}"
    except Exception as e:
        logging.error(f"Error in tampering detection for {image_path}: {str(e)}")
        return "Error in tampering detection"

def save_to_csv(data, output_file='tampering_report.csv'):
    """Save detailed details to CSV."""
    headers = ['File', 'Tampering Status', 'Score', 'Details']
    
    def write_csv(file_path, data):
        try:
            os.makedirs(os.path.dirname(file_path) or '.', exist_ok=True)
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                for entry in data:
                    parts = entry['tampering'].split(' (Score: ')
                    status = parts[0]
                    score_part = parts[1].split(')/100) - ')
                    score = score_part[0]
                    detail = score_part[1] if len(score_part) > 1 else ''
                    writer.writerow([
                        entry['file'],
                        status,
                        score,
                        detail
                    ])
            logging.info(f"Detailed report saved to {file_path}")
            return True
        except Exception as e:
            logging.error(f"Failed to save to {file_path}: {str(e)}")
            return False
    
    # Try paths as before
    if write_csv(output_file, data):
        return
    
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop", "tampering_report.csv")
    if write_csv(desktop_path, data):
        return
    
    # Custom path prompt
    while True:
        custom_path = input("Enter custom output path: ").strip().strip('"').strip("'")
        if not custom_path:
            return
        custom_path = os.path.normpath(custom_path)
        if os.path.isdir(custom_path) or not os.path.splitext(custom_path)[1]:
            custom_path = os.path.join(custom_path, 'tampering_report.csv')
        if write_csv(custom_path, data):
            return

def process_path(input_path=None):
    """Process images in path."""
    results = []
    valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.tiff')
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if not input_path:
        input_path = script_dir
    
    input_path = os.path.normpath(os.path.join(script_dir, input_path.strip().strip('"').strip("'")))
    
    if not os.path.exists(input_path):
        logging.error(f"Path does not exist: {input_path}")
        return
    
    if os.path.isfile(input_path) and input_path.lower().endswith(valid_extensions):
        tampering_result = detect_tampering(input_path)
        results.append({'file': os.path.basename(input_path), 'tampering': tampering_result})
    elif os.path.isdir(input_path):
        for file_name in os.listdir(input_path):
            if file_name.lower().endswith(valid_extensions):
                image_path = os.path.join(input_path, file_name)
                logging.info(f"Processing {file_name}...")
                tampering_result = detect_tampering(image_path)
                results.append({'file': file_name, 'tampering': tampering_result})
    else:
        logging.error("Invalid path or unsupported format.")
        return
    
    if results:
        save_to_csv(results)
    else:
        logging.warning("No valid images found.")

def main():
    """Main entry point."""
    try:
        input_path = input("Enter image/folder path (Enter for script dir): ").strip()
        process_path(input_path if input_path else None)
    except KeyboardInterrupt:
        logging.info("Process interrupted.")
    except Exception as e:
        logging.error(f"Main error: {str(e)}")

if __name__ == "__main__":
    main()
import os
def run_tampering_checks(file_path):
    # Example placeholder logic
    status = "untampered"
    score = 0
    details = {"note": "No checks implemented yet"}
    return status, score, details

def analyze(file_path):
    results = []

    # ✅ Call your existing tampering functions here
    # Example (replace with your real function names):
    status, score, details = run_tampering_checks(file_path)

    results.append({
        "file": os.path.basename(file_path),
        "status": status,
        "score": score,
        "details": details
    })

    return results
