#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";

const HOME_DIR = os.homedir();
const GLOBAL_CONFIG_DIR = path.join(HOME_DIR, ".lepos");
const GLOBAL_CONFIG_PATH = path.join(GLOBAL_CONFIG_DIR, "auth.json");
const LOCAL_CONFIG_DIR = path.join(process.cwd(), ".lepos");
const LOCAL_CONFIG_PATH = path.join(LOCAL_CONFIG_DIR, "config.json");

const API_HOST = process.env.LEPOS_API_HOST || "http://localhost:3000";

function getGlobalToken() {
  if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
    return null;
  }
  try {
    const config = JSON.parse(fs.readFileSync(GLOBAL_CONFIG_PATH, "utf8"));
    return config.token || null;
  } catch (e) {
    return null;
  }
}

function getLocalConfig() {
  if (!fs.existsSync(LOCAL_CONFIG_PATH)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_CONFIG_PATH, "utf8"));
  } catch (e) {
    return null;
  }
}

async function handleLogin(token) {
  if (!token) {
    console.error("Error: Please provide your Personal Access Token.");
    console.log("Usage: lepos login <token>");
    process.exit(1);
  }

  if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
    fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify({ token }, null, 2), "utf8");
  console.log("✅ Successfully logged in! Token saved to ~/.lepos/auth.json");
}

async function handleLink(projectId) {
  const token = getGlobalToken();
  if (!token) {
    console.error("Error: Not logged in. Run 'lepos login <token>' first.");
    process.exit(1);
  }

  if (!projectId) {
    console.error("Error: Please specify the projectId.");
    console.log("Usage: lepos link <projectId>");
    process.exit(1);
  }

  if (!fs.existsSync(LOCAL_CONFIG_DIR)) {
    fs.mkdirSync(LOCAL_CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify({ projectId }, null, 2), "utf8");
  console.log(`✅ Project linked successfully! Config saved to .lepos/config.json`);
}

async function handleEnvPull() {
  const token = getGlobalToken();
  const localConfig = getLocalConfig();

  if (!token) {
    console.error("Error: Not logged in. Run 'lepos login <token>' first.");
    process.exit(1);
  }
  if (!localConfig || !localConfig.projectId) {
    console.error("Error: Project not linked. Run 'lepos link <projectId>' first.");
    process.exit(1);
  }

  try {
    console.log("Fetching environment variables from LepoS...");
    const res = await fetch(`${API_HOST}/api/v1/projects/${localConfig.projectId}/env`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch environment variables");
    }

    const { envVars } = await res.json();
    let envContent = "";
    for (const [key, val] of Object.entries(envVars)) {
      envContent += `${key}=${val}\n`;
    }

    fs.writeFileSync(path.join(process.cwd(), ".env.local"), envContent, "utf8");
    console.log("✅ Environment variables pulled and written to .env.local");
  } catch (e) {
    console.error("Error:", e.message);
  }
}

async function handleDeploy() {
  const token = getGlobalToken();
  const localConfig = getLocalConfig();

  if (!token) {
    console.error("Error: Not logged in. Run 'lepos login <token>' first.");
    process.exit(1);
  }
  if (!localConfig || !localConfig.projectId) {
    console.error("Error: Project not linked. Run 'lepos link <projectId>' first.");
    process.exit(1);
  }

  try {
    console.log("Triggering deployment on LepoS...");
    const res = await fetch(`${API_HOST}/api/v1/deployments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        projectId: localConfig.projectId,
        version: "1.0.0",
        changelog: "Deploy via LepoS CLI"
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to trigger deployment");
    }

    const { deployment } = await res.json();
    console.log(`🚀 Deployment triggered successfully!`);
    console.log(`Build Number: ${deployment.buildNumber}`);
    console.log(`Status: ${deployment.status}`);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

async function handleLogs() {
  const token = getGlobalToken();
  const localConfig = getLocalConfig();

  if (!token) {
    console.error("Error: Not logged in. Run 'lepos login <token>' first.");
    process.exit(1);
  }
  if (!localConfig || !localConfig.projectId) {
    console.error("Error: Project not linked. Run 'lepos link <projectId>' first.");
    process.exit(1);
  }

  try {
    console.log("Connecting to LepoS logs stream...");
    const res = await fetch(`${API_HOST}/api/projects/${localConfig.projectId}/functions/logs`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to connect to logs stream" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      process.stdout.write(chunk);
    }
  } catch (e) {
    console.error("Error streaming logs:", e.message);
  }
}

function printHelp() {
  console.log("LepoS CLI - Command Line Tool");
  console.log("\nCommands:");
  console.log("  login <token>    Login with your Personal Access Token");
  console.log("  link <projectId> Link current directory to a project");
  console.log("  env pull         Pull environment variables to .env.local");
  console.log("  deploy           Trigger project deployment");
  console.log("  logs             Stream project runtime logs");
}

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case "login":
    handleLogin(arg);
    break;
  case "link":
    handleLink(arg);
    break;
  case "env":
    if (arg === "pull") {
      handleEnvPull();
    } else {
      console.log("Unknown argument. Did you mean 'env pull'?");
    }
    break;
  case "deploy":
    handleDeploy();
    break;
  case "logs":
    handleLogs();
    break;
  case "--help":
  case "-h":
  default:
    printHelp();
}
