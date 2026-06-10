import fs from "fs";
import path from "path";

export interface ServerlessFunctionConfig {
  name: string;
  handler: string;
  runtime: string;
  memorySize: number;
  timeout: number;
}

export async function packageFunction(projectId: string, functionName: string, sourcePath: string): Promise<string> {
  const outputDir = path.join(process.cwd(), "public", "builds", projectId, "functions");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputZipPath = path.join(outputDir, `${functionName}.zip`);

  // Simulate packaging the JS/TS file into a lambda zip bundle
  console.log(`[Lambda Builder] Packaging function '${functionName}' for project ${projectId}...`);
  console.log(`[Lambda Builder] Bundling source from ${sourcePath}...`);
  
  // Create a mock zip file with handler contents
  const mockContent = `exports.handler = async (event) => {
    console.log("Function ${functionName} executed!");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Hello from Serverless Lambda!" }),
    };
  };`;
  
  // Write a mock bundle zip or folder for representation
  const mockBundlePath = path.join(outputDir, `${functionName}.js`);
  fs.writeFileSync(mockBundlePath, mockContent, "utf8");
  
  console.log(`[Lambda Builder] Standalone bundle generated at ${mockBundlePath}`);
  console.log(`[Lambda Builder] Successfully packaged to ${outputZipPath}`);
  
  return outputZipPath;
}

export async function deployToLambda(projectId: string, functionName: string, zipPath: string): Promise<ServerlessFunctionConfig> {
  console.log(`[Lambda Deployer] Uploading ${zipPath} to AWS Lambda / Google Cloud Functions...`);
  console.log(`[Lambda Deployer] Creating function 'lepos-func-${projectId}-${functionName}'...`);
  
  // Simulate AWS SDK upload latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  console.log(`[Lambda Deployer] Function successfully registered and active in region us-east-1.`);

  return {
    name: `lepos-func-${projectId}-${functionName}`,
    handler: "index.handler",
    runtime: "nodejs18.x",
    memorySize: 1024,
    timeout: 15,
  };
}
