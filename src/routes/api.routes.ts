import { createFormModule } from "@/modules/form/form.module.js";
import { Router } from "express";
import { createUserModule } from "@/modules/user/user.module.js";

const formModule = createFormModule();
const userModule = createUserModule();

export const apiRoutes = Router();

apiRoutes.use("/forms", formModule.routes);
apiRoutes.use("/users", userModule.routes);
