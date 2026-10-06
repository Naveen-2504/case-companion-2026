// import { Router } from "express";
// import { asyncHandler } from "../middleware/errorHandler";
// import { upload, verifyMagicBytes } from "../middleware/upload";
// import { caseInputSchema, idSchema, listQuerySchema, slotSchema } from "../schemas/case.schema";
// import * as svc from "../services/case.service";
// import { deleteObject, uploadDocument } from "../services/storage.service";
// import { badRequest, notFound } from "../utils/AppError";

// export const casesRouter = Router();

// casesRouter.get("/", asyncHandler(async (req, res) => {
//   res.json(await svc.listCases(listQuerySchema.parse(req.query)));
// }));

// casesRouter.post("/", asyncHandler(async (req, res) => {
//   res.status(201).json(await svc.createCase(caseInputSchema.parse(req.body)));
// }));

// casesRouter.get("/:id", asyncHandler(async (req, res) => {
//   res.json(await svc.getCase(idSchema.parse(req.params.id)));
// }));

// casesRouter.put("/:id", asyncHandler(async (req, res) => {
//   res.json(await svc.updateCase(idSchema.parse(req.params.id), caseInputSchema.parse(req.body)));
// }));

// casesRouter.delete("/:id", asyncHandler(async (req, res) => {
//   await svc.deleteCase(idSchema.parse(req.params.id));
//   res.status(204).end();
// }));

// // Upload or replace a document in slot 0..3 (max 4 per case by construction).
// casesRouter.post(
//   "/:id/documents/:slot",
//   upload.single("file"),
//   asyncHandler(async (req, res) => {
//     const id = idSchema.parse(req.params.id);
//     const slot = slotSchema.parse(req.params.slot);

//     if (!req.file) {
//       throw badRequest("No file provided");
//     }

//     if (!verifyMagicBytes(req.file.buffer, req.file.mimetype)) {
//       throw badRequest("File content does not match its type");
//     }

//     if (!(await svc.caseExists(id))) {
//       throw notFound("Case");
//     }

//     // Convert uploaded file to Base64.
//     // No Firebase Storage is used.
//     const meta = await uploadDocument(id, slot, req.file);

//     const updatedCase = await svc.setDocumentSlot(
//       id,
//       slot,
//       meta,
//     );

//     res.json(updatedCase);
//   }),
// );

// casesRouter.delete("/:id/documents/:slot", asyncHandler(async (req, res) => {
//   res.json(await svc.setDocumentSlot(idSchema.parse(req.params.id), slotSchema.parse(req.params.slot), null));
// }));

import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import {
  upload,
  verifyMagicBytes,
} from "../middleware/upload";

import {
  caseInputSchema,
  idSchema,
  listQuerySchema,
  slotSchema,
} from "../schemas/case.schema";

import * as svc from "../services/case.service";

import {
  deleteObject,
  uploadDocument,
} from "../services/storage.service";

import {
  badRequest,
  notFound,
} from "../utils/AppError";

export const casesRouter = Router();


// ============================================================
// GET /cases
// List cases
// ============================================================

casesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(
      req.query,
    );

    res.json(
      await svc.listCases(query),
    );
  }),
);


// ============================================================
// POST /cases
// Create case
// ============================================================

casesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input =
      caseInputSchema.parse(req.body);

    res.status(201).json(
      await svc.createCase(input),
    );
  }),
);


// ============================================================
// GET /cases/:id
// Get one case
// ============================================================

casesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = idSchema.parse(
      req.params.id,
    );

    res.json(
      await svc.getCase(id),
    );
  }),
);


// ============================================================
// PUT /cases/:id
// Update case
// ============================================================

casesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = idSchema.parse(
      req.params.id,
    );

    const input =
      caseInputSchema.parse(req.body);

    res.json(
      await svc.updateCase(
        id,
        input,
      ),
    );
  }),
);


// ============================================================
// DELETE /cases/:id
// Delete case
// ============================================================

casesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = idSchema.parse(
      req.params.id,
    );

    await svc.deleteCase(id);

    res.status(204).end();
  }),
);


// ============================================================
// POST /cases/:id/documents/:slot
//
// Upload / replace document.
//
// slot = 0, 1, 2, or 3
//
// Frontend sends:
//
// FormData:
//   file = File
//
// File goes:
//
// Browser
//    ↓
// Node backend
//    ↓
// Supabase Storage
//    ↓
// Firestore metadata
// ============================================================

casesRouter.post(
  "/:id/documents/:slot",

  upload.single("file"),

  asyncHandler(async (req, res) => {
    const id = idSchema.parse(
      req.params.id,
    );

    const slot = slotSchema.parse(
      req.params.slot,
    );


    // --------------------------------------------------------
    // Check file
    // --------------------------------------------------------

    if (!req.file) {
      throw badRequest(
        "No file provided",
      );
    }


    // --------------------------------------------------------
    // Check actual file content
    // --------------------------------------------------------

    if (
      !verifyMagicBytes(
        req.file.buffer,
        req.file.mimetype,
      )
    ) {
      throw badRequest(
        "File content does not match its type",
      );
    }


    // --------------------------------------------------------
    // Check case exists
    // --------------------------------------------------------

    if (!(await svc.caseExists(id))) {
      throw notFound("Case");
    }


    // --------------------------------------------------------
    // Upload to Supabase Storage
    // --------------------------------------------------------

    const meta =
      await uploadDocument(
        id,
        slot,
        req.file,
      );


    // --------------------------------------------------------
    // Save metadata to Firestore
    //
    // IMPORTANT:
    // The actual image is NOT saved to Firestore.
    //
    // Firestore receives:
    //
    //   id
    //   filename
    //   mimetype
    //   size
    //   path
    //   url
    // --------------------------------------------------------

    try {
      const updatedCase =
        await svc.setDocumentSlot(
          id,
          slot,
          meta,
        );

      res.json(updatedCase);
    } catch (error) {

      // ------------------------------------------------------
      // Firestore failed.
      //
      // Remove the uploaded Supabase file so we don't leave
      // an orphaned image.
      // ------------------------------------------------------

      await deleteObject(
        meta.path,
      );

      throw error;
    }
  }),
);


// ============================================================
// DELETE /cases/:id/documents/:slot
//
// Remove document from case.
//
// Also removes the actual file from Supabase Storage.
//
// ============================================================

casesRouter.delete(
  "/:id/documents/:slot",

  asyncHandler(async (req, res) => {
    const id = idSchema.parse(
      req.params.id,
    );

    const slot = slotSchema.parse(
      req.params.slot,
    );


    // --------------------------------------------------------
    // Get existing case first so we can find the Supabase path
    // --------------------------------------------------------

    const existingCase =
      await svc.getCase(id);


    const documents =
      existingCase.documents ?? [];


    const existingDocument =
      documents[slot];


    // --------------------------------------------------------
    // Remove from Firestore
    // --------------------------------------------------------

    const updatedCase =
      await svc.setDocumentSlot(
        id,
        slot,
        null,
      );


    // --------------------------------------------------------
    // Remove actual file from Supabase
    // --------------------------------------------------------

    if (
      existingDocument?.path
    ) {
      await deleteObject(
        existingDocument.path,
      );
    }


    res.json(updatedCase);
  }),
);
