const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");

const { JsonRpcProvider, Contract } = require("ethers");

// Load ABI
const contractABI = require("../blockchain/artifacts/contracts/Registry.sol/Registry.json").abi;

// Contract address from deployment
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Connect to Hardhat local node
const provider = new JsonRpcProvider("http://127.0.0.1:8545");

// Get signer (first account)
const signer = provider.getSigner(0);

// ⚡ In ethers v6, pass signer as the runner
const registry = new Contract(contractAddress, contractABI, signer);

// Express setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Upload certificates
app.post("/uploadCertificates", async (req, res) => {
  try {
    const { names, rollNumbers, courses, cgpas, issuedYears } = req.body;

    const tx = await registry.registerCertificatesBatch(
      names,
      rollNumbers,
      courses,
      cgpas,
      issuedYears
    );
    await tx.wait();

    res.json({ message: "Certificates uploaded successfully", txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error uploading certificates", details: err.message });
  }
});

// Verify certificate
app.post("/verifyCertificate", async (req, res) => {
  try {
    const { rollNumber, name, course, cgpa, issuedYear } = req.body;

    const result = await registry.verifyCertificate(
      rollNumber,
      name,
      course,
      cgpa,
      issuedYear
    );

    res.json({ verified: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error verifying certificate", details: err.message });
  }
});

const PORT = 5002;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
