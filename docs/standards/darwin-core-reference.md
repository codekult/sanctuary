# Darwin Core Reference — Sanctuary Alignment

This document summarizes how Sanctuary's data model maps to Darwin Core (DwC) standards.
Kept as reference for future GBIF export compatibility.

## What is Darwin Core?

An open standard maintained by TDWG (Biodiversity Information Standards) for sharing biodiversity data. It provides a common vocabulary centered on the **Occurrence** — a record that something was observed at a place and time.

## Key Term Groups

### Occurrence (the event)
- `occurrenceID` — globally unique identifier
- `basisOfRecord` — HumanObservation, MachineObservation, LivingSpecimen, etc.
- `recordedBy` — observer name(s)
- `individualCount`, `sex`, `lifeStage`, `behavior`

### Taxon (what was observed)
- `scientificName` — full accepted name (e.g., "Quercus robur L.")
- `taxonRank` — species, genus, family, etc.
- `kingdom`, `phylum`, `class`, `order`, `family`, `genus`
- `vernacularName` — common name
- `taxonID` — reference to authoritative record

### Location (where)
- `decimalLatitude`, `decimalLongitude` (WGS84)
- `coordinateUncertaintyInMeters`
- `locality` — human-readable place description
- `country`, `stateProvince`

### Time (when)
- `eventDate` — ISO 8601 format
- `year`, `month`, `day`

### Media
- Handled via **Audubon Core** extension
- `associatedMedia` — URIs to media files

## Sanctuary Mapping

| Sanctuary Entity | DwC Equivalent | Notes |
|---|---|---|
| Observation | Occurrence | Direct mapping. `basisOfRecord` = HumanObservation |
| Taxon | Taxon | Aligned fields. `externalId` maps to `taxonID` |
| Individual | Organism | DwC has an Organism class for tracked individuals |
| Media | Audubon Core | Media linked to occurrences |
| PhenologyEvent | MeasurementOrFact | Lifecycle events map to the MeasurementOrFact extension |
| Property | Location | Property = the locality context |

## Minimum Viable Record (for future GBIF export)

A usable record needs: **what** (taxon), **where** (coordinates), **when** (date), **who** (observer), **how** (basis of record), and ideally **evidence** (photo).

## Taxonomy Hierarchy

```
Kingdom > Phylum > Class > Order > Family > Genus > Species > Subspecies/Variety
```

Additional useful ranks: Tribe, Section (plants), Aggregate (hard-to-distinguish species groups), Cultivar (horticulture, outside formal nomenclature).

## Key Design Principle

> Store the verbatim record (what the observer submitted) separately from the interpreted record (standardized version). Never destroy original data.

Sanctuary follows this by allowing taxon re-identification on observations without losing the original entry.
