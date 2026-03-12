const modelTemplate = (moduleName) => {
  const moduleNameLowerCase = moduleName.toLowerCase();

  return `
import { Schema, model } from "mongoose";

const ${moduleNameLowerCase}Schema = new Schema(
  {},
  { timestamps: true }
);

const ${moduleName} = model("${moduleName}", ${moduleNameLowerCase}Schema);

export default ${moduleName};
  `.trim();
};

const controllerTemplate = (moduleName) => {
  const moduleNameLowerCase = moduleName.toLowerCase();

  return `
import ${moduleName}Service from "./${moduleNameLowerCase}.service.js";
import sendResponse from "../../../util/sendResponse.js";
import catchAsync from "../../../util/catchAsync.js";

const post${moduleName} = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.post${moduleName}(req.user, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "${moduleName} created successfully",
    data: result,
  });
});

const get${moduleName} = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.get${moduleName}(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "${moduleName} retrieved successfully",
    data: result,
  });
});

const getAll${moduleName}s = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.getAll${moduleName}s(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "${moduleName}s retrieved successfully",
    data: result,
  });
});

const update${moduleName} = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.update${moduleName}(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "${moduleName} updated successfully",
    data: result,
  });
});

const delete${moduleName} = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.delete${moduleName}(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "${moduleName} deleted successfully",
    data: result,
  });
});

const ${moduleName}Controller = {
  post${moduleName},
  get${moduleName},
  getAll${moduleName}s,
  update${moduleName},
  delete${moduleName},
};

export default ${moduleName}Controller;
  `.trim();
};

const routesTemplate = (moduleName) => {
  const moduleNameLowerCase = moduleName.toLowerCase();

  return `
import express from "express";
import auth from "../../middleware/auth.js";
import config from "../../../config.js";
import ${moduleName}Controller from "./${moduleNameLowerCase}.controller.js";

const router = express.Router();

router
  .post("/", auth(config.auth_level.user), ${moduleName}Controller.post${moduleName})
  .get("/:id", auth(config.auth_level.user), ${moduleName}Controller.get${moduleName})
  .get("/", auth(config.auth_level.user), ${moduleName}Controller.getAll${moduleName}s)
  .patch("/:id", auth(config.auth_level.user), ${moduleName}Controller.update${moduleName})
  .delete("/:id", auth(config.auth_level.user), ${moduleName}Controller.delete${moduleName});

export default router;
  `.trim();
};

const serviceTemplate = (moduleName) => {
  const moduleNameLowerCase = moduleName.toLowerCase();

  return `
import status from "http-status";
import ${moduleName} from "./${moduleName}.js";
import QueryBuilder from "../../../builder/queryBuilder.js";
import ApiError from "../../../error/ApiError.js";
import validateFields from "../../../util/validateFields.js";

const post${moduleName} = async (userData, payload) => {
  // Add your logic here
};

const get${moduleName} = async (userData, query) => {
  validateFields(query, ["${moduleNameLowerCase}Id"]);

  const ${moduleNameLowerCase} = await ${moduleName}.findOne({
    _id: query.${moduleNameLowerCase}Id,
  }).lean();

  if (!${moduleNameLowerCase}) {
    throw new ApiError(status.NOT_FOUND, "${moduleName} not found");
  }

  return ${moduleNameLowerCase};
};

const getAll${moduleName}s = async (userData, query) => {
  const ${moduleNameLowerCase}Query = new QueryBuilder(
    ${moduleName}.find({}).lean(),
    query
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [${moduleNameLowerCase}s, meta] = await Promise.all([
    ${moduleNameLowerCase}Query.modelQuery,
    ${moduleNameLowerCase}Query.countTotal(),
  ]);

  return { meta, ${moduleNameLowerCase}s };
};

const update${moduleName} = async (userData, payload) => {
  // Add your logic here
};

const delete${moduleName} = async (userData, payload) => {
  validateFields(payload, ["${moduleNameLowerCase}Id"]);

  const ${moduleNameLowerCase} = await ${moduleName}.deleteOne({
    _id: payload.${moduleNameLowerCase}Id,
  });

  if (!${moduleNameLowerCase}.deletedCount) {
    throw new ApiError(status.NOT_FOUND, "${moduleName} not found");
  }

  return ${moduleNameLowerCase};
};

const ${moduleName}Service = {
  post${moduleName},
  get${moduleName},
  getAll${moduleName}s,
  update${moduleName},
  delete${moduleName},
};

export default ${moduleName}Service;
  `.trim();
};

export {
  modelTemplate,
  controllerTemplate,
  routesTemplate,
  serviceTemplate,
};