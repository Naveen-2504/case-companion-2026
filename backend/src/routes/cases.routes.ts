import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { upload, verifyMagicBytes } from "../middleware/upload";
import { caseInputSchema, idSchema, listQuerySchema, slotSchema } from "../schemas/case.schema";
import * as svc from "../services/case.service";
import { deleteObject, uploadDocument } from "../services/storage.service";
import { badRequest, notFound } from "../utils/AppError";

export const casesRouter = Router();

casesRouter.get("/", asyncHandler(async (req, res) => {
  res.json(await svc.listCases(listQuerySchema.parse(req.query)));
}));

casesRouter.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await svc.createCase(caseInputSchema.parse(req.body)));
}));

casesRouter.get("/:id", asyncHandler(async (req, res) => {
  res.json(await svc.getCase(idSchema.parse(req.params.id)));
}));

casesRouter.put("/:id", asyncHandler(async (req, res) => {
  res.json(await svc.updateCase(idSchema.parse(req.params.id), caseInputSchema.parse(req.body)));
}));

casesRouter.delete("/:id", asyncHandler(async (req, res) => {
  await svc.deleteCase(idSchema.parse(req.params.id));
  res.status(204).end();
}));

// Upload or replace a document in slot 0..3 (max 4 per case by construction).
casesRouter.post("/:id/documents/:slot", upload.single("file"), asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const slot = slotSchema.parse(req.params.slot);
  if (!req.file) throw badRequest("No file provided");
  if (!verifyMagicBytes(req.file.buffer, req.file.mimetype)) throw badRequest("File content does not match its type");
  if (!(await svc.caseExists(id))) throw notFound("Case");
  const meta = await uploadDocument(id, slot, req.file);
  try {
    res.json(await svc.setDocumentSlot(id, slot, meta));
  } catch (e) {
    await deleteObject(meta.path); // roll back orphan
    throw e;
  }
}));

casesRouter.delete("/:id/documents/:slot", asyncHandler(async (req, res) => {
  res.json(await svc.setDocumentSlot(idSchema.parse(req.params.id), slotSchema.parse(req.params.slot), null));
}));
