import { schedule } from ".";
import { insertSchedules } from "../subabase/module";

(async () => insertSchedules(await schedule()))();