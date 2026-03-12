import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  modelTemplate,
  controllerTemplate,
  routesTemplate,
  serviceTemplate,
} from "./fileTemplates.js";

// ESM এ __dirname বানানোর নিয়ম
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateModule = (moduleName) => {
  if (!moduleName) {
    console.error("❌ Module name required: node generate.js <ModuleName>");
    process.exit(1);
  }

  // সবসময় PascalCase নিশ্চিত করো
  // "product" বা "Product" দুটোই কাজ করবে
  const formattedName =
    moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  const lowerName = formattedName.toLowerCase();

  // Bug Fix: একটাই variable, lowercase folder
  const dirPath = path.join(__dirname, "src", "app", "module", lowerName);

  // const dirPath = path.join(__dirname, lowerName);

  if (fs.existsSync(dirPath)) {
    console.log(`🚫 "${formattedName}" module already exists at: ${dirPath}`);
    return;
  }

  // Folder বানাও
  fs.mkdirSync(dirPath, { recursive: true });

  // চারটা file বানাও
  const files = [
    {
      name: `${lowerName}.model.js`,
      content: modelTemplate(formattedName),
    },
    {
      name: `${lowerName}.controller.js`,
      content: controllerTemplate(formattedName),
    },
    {
      name: `${lowerName}.routes.js`,
      content: routesTemplate(formattedName),
    },
    {
      name: `${lowerName}.service.js`,
      content: serviceTemplate(formattedName),
    },
  ];

  files.forEach(({ name, content }) => {
    fs.writeFileSync(path.join(dirPath, name), content, "utf8");
    console.log(`✅ Created: ${name}`);
  });

  console.log(`\n🚀 Module "${formattedName}" ready at: ${dirPath}`);
};

// Terminal থেকে argument নাও — hardcode নয়
const moduleName = process.argv[2];
generateModule(moduleName);