CREATE INDEX "taxa_kingdom_idx" ON "taxa" USING btree ("kingdom");--> statement-breakpoint
CREATE INDEX "taxa_taxon_rank_idx" ON "taxa" USING btree ("taxon_rank");--> statement-breakpoint
CREATE INDEX "taxa_scientific_name_idx" ON "taxa" USING btree ("scientific_name");--> statement-breakpoint
CREATE UNIQUE INDEX "taxa_external_id_source_idx" ON "taxa" USING btree ("external_id","external_source");