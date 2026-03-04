import { router } from "../trpc.js";
import { taxonRouter } from "./taxon.js";
import { individualRouter } from "./individual.js";
import { observationRouter } from "./observation.js";
import { phenologyRouter } from "./phenology.js";
import { mediaRouter } from "./media.js";
import { propertyRouter } from "./property.js";

export const appRouter = router({
  taxon: taxonRouter,
  individual: individualRouter,
  observation: observationRouter,
  phenology: phenologyRouter,
  media: mediaRouter,
  property: propertyRouter,
});

export type AppRouter = typeof appRouter;
