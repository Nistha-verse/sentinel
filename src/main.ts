import {validateProject} from "./validators/projectValidator";
import {printReport} from "./report";
const sections = [validateProject()];
printReport(sections);