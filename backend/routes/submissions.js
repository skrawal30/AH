const express = require("express");
const multer = require("multer");
const controller = require("../controllers/submissionController");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
const maxSize = Number(process.env.MAX_FILE_SIZE_MB || 25) * 1024 * 1024;
const maxFiles = Number(process.env.MAX_FILES || 20);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize, files: maxFiles },
});

// Accept the current frontend field name assignmentFiles.
// attachments and assignmentFilePicker are accepted for compatibility with older forms and browsers.
const receiveFiles = upload.fields([
  { name: "assignmentFiles", maxCount: maxFiles },
  { name: "attachments", maxCount: maxFiles },
  { name: "assignmentFilePicker", maxCount: maxFiles },
]);

router.post("/", receiveFiles, controller.createSubmission);

router.get("/", requireAdmin, controller.listSubmissions);

// These MUST come before /:id.
router.get("/attachments/:id/view", requireAdmin, controller.viewAttachment);
router.get("/attachments/:id/download", requireAdmin, controller.downloadAttachment);
router.get("/files/:id", requireAdmin, controller.downloadAttachment);

router.get("/:id", requireAdmin, controller.getSubmission);
router.patch("/:id/status", requireAdmin, controller.updateStatus);

module.exports = router;
