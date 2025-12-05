import * as fs from "fs";
import * as path from "path";

const errors = [];

function checkFile(filePath, checks) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf-8");

  checks.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      errors.push(`${filePath}: ${message}`);
    }
  });
}

function checkDirectory(dirPath, checks) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const files = fs.readdirSync(dirPath, { recursive: true });
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile() && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
      checkFile(filePath, checks);
    }
  });
}

// Check for SSR/ISR/Edge violations
const ssrChecks = [
  {
    pattern: /getServerSideProps/,
    message: "getServerSideProps is not allowed in static export",
  },
  {
    pattern: /getStaticProps/,
    message: "getStaticProps is not allowed (use generateStaticParams instead)",
  },
  {
    pattern: /server-only/,
    message: "server-only package is not allowed",
  },
  {
    pattern: /next\/headers/,
    message: "next/headers is not allowed in static export",
  },
  {
    pattern: /cookies\(\)/,
    message: "cookies() is not allowed in static export",
  },
  {
    pattern: /dynamic\s*=\s*['"]force-dynamic['"]/,
    message: "dynamic='force-dynamic' is not allowed",
  },
];

// Check app directory
checkDirectory("./app", ssrChecks);

// Check for API routes
const apiRoutePath = "./app/api";
if (fs.existsSync(apiRoutePath)) {
  errors.push(`${apiRoutePath}: API routes are not allowed in static export`);
}

const pagesApiPath = "./pages/api";
if (fs.existsSync(pagesApiPath)) {
  errors.push(`${pagesApiPath}: API routes are not allowed in static export`);
}

if (errors.length > 0) {
  console.error("\n❌ Static export check failed:\n");
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
} else {
  console.log("✅ Static export check passed");
}

