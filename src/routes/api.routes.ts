import { createFormModule } from "../modules/form/form.module";
import { Router } from "express";
import { createUserModule } from "../modules/user/user.module";

const formModule = createFormModule();
const userModule = createUserModule();

export const apiRoutes = Router();

apiRoutes.use("/forms", formModule.routes);
apiRoutes.use("/users", userModule.routes);
