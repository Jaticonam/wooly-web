import { LoadProductsStep } from "../steps/LoadProductsStep";
import { QualityStep } from "../steps/QualityStep";
import { PublicationStep } from "../steps/PublicationStep";
import { PreviewStep } from "../steps/PreviewStep";
import { IntegrationStep } from "../steps/IntegrationStep";
import { HistoryStep } from "../steps/HistoryStep";

import { StepRegistry } from "./StepRegistry";

StepRegistry.register(LoadProductsStep);
StepRegistry.register(QualityStep);
StepRegistry.register(PublicationStep);
StepRegistry.register(PreviewStep);
StepRegistry.register(IntegrationStep);
StepRegistry.register(HistoryStep);

export { StepRegistry };
