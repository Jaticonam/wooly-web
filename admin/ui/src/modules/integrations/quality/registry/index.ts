import { IdRule } from "../validators/IdRule";
import { PriceRule } from "../validators/PriceRule";
import { ImageRule } from "../validators/ImageRule";

import { RuleRegistry } from "./RuleRegistry";

RuleRegistry.register(IdRule);
RuleRegistry.register(PriceRule);
RuleRegistry.register(ImageRule);

export { RuleRegistry };
