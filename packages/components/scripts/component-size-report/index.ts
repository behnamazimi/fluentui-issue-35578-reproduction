import fs from "fs";
import dotenv from "dotenv";
import config from "./config.js";
import { Converter, ComponentReport } from "./Converter.js";
import { GitLab } from "../../../../scripts/gitlab/GitLab.js";
import { COMPONENT_SIZE_REPORT_MARKER } from "./buildCommentText.js";
import { buildCommentText } from "./buildCommentText.js";

dotenv.config();

interface StatsEntry {
  filename: string;
  parsedSize: number;
  gzipSize?: number;
  brotliSize?: number;
  source?: Array<{
    groups?: Array<{
      filename?: string;
      parsedSize?: number;
    }>;
  }>;
}

const getComponentReport = async (): Promise<ComponentReport> => {
  if (!fs.existsSync(config.DEFAULT_STATS_PATH)) {
    throw new Error(
      `Stats file not found at ${config.DEFAULT_STATS_PATH}. Make sure the build has completed.`
    );
  }

  let statsContent: string;
  try {
    statsContent = fs.readFileSync(config.DEFAULT_STATS_PATH, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read stats file: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  let stats: StatsEntry[];
  try {
    stats = JSON.parse(statsContent);
  } catch (error) {
    throw new Error(
      `Failed to parse stats.json: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!Array.isArray(stats)) {
    throw new Error("stats.json should contain an array of entries");
  }

  const componentReport = Converter.extractComponentSizes(stats);
  return componentReport;
};

(async () => {
  try {
    if (config.DRY_RUN) {
      console.log(
        "🔍 Running in DRY-RUN mode - no GitLab API calls will be made\n"
      );
    }

    console.log("Reading component size report...");
    const componentReport = await getComponentReport();
    console.log(
      `✅ Report was read. Found ${Object.keys(componentReport).length} components.`
    );

    if (Object.keys(componentReport).length === 0) {
      console.log("⚠️  No components found in stats.json");
      process.exit(0);
    }

    // Build artifact
    console.log("Building artifact...");
    const artifact = Converter.report2artifact(componentReport);

    if (!config.DRY_RUN) {
      fs.writeFileSync(
        `${config.DEFAULT_ARTIFACT_PATH}${config.ARTIFACT_NAME}`,
        artifact
      );
      console.log("✅ Artifact has been built.");
    } else {
      console.log("[DRY RUN] Would save artifact to file:");
      console.log(artifact);
    }

    // Skip GitLab operations on master branch
    if (config.CURRENT_BRANCH === config.DEFAULT_BRANCH) {
      console.log(
        `Current branch is ${config.DEFAULT_BRANCH}, skipping GitLab operations.`
      );
      process.exit(0);
    }

    // Fetch master artifact for comparison
    let masterReport: ComponentReport = {};

    console.log("Reading artifact from master branch...");
    try {
      const latestMasterPushPipeline =
        await GitLab.getLatestMasterPushPipeline();
      console.log("✅ Got latest master pipeline");

      const reportJob = await GitLab.getJobFromPipeline(
        latestMasterPushPipeline.id,
        config.JOB_NAME
      );
      console.log("✅ Got report job");

      let masterArtifact = "";
      try {
        masterArtifact = await GitLab.getArtifactFromJob(
          reportJob.id,
          config.ARTIFACT_PATH
        );
        masterReport = Converter.artifact2report(masterArtifact);
        console.log("✅ Artifact from master has been processed.");
      } catch (error) {
        console.log(
          "⚠️  Can't read an artifact from master. Using empty comparison."
        );
        masterReport = {};
      }
    } catch (error) {
      console.log(
        `⚠️  Could not fetch master artifact: ${error instanceof Error ? error.message : String(error)}. Using empty comparison.`
      );
      masterReport = {};
    }

    // Build comment
    console.log("Building comment...");
    const md = buildCommentText(componentReport, masterReport);

    if (config.DRY_RUN) {
      console.log("\n📝 Generated comment preview:");
      console.log("=".repeat(50));
      console.log(md);
      console.log("=".repeat(50));
    }

    // Add comment (dry-run is handled by GitLab client)
    console.log("Adding comment to merge request...");

    // Delete previous component-size-report comments first
    const mrIID = await GitLab.getMRID(
      config.CURRENT_BRANCH,
      config.DEFAULT_BRANCH
    );
    await GitLab.deleteCommentsByAuthor(
      mrIID,
      "SA GitLab Management System",
      COMPONENT_SIZE_REPORT_MARKER
    );

    // Check if the new comment is the same as any remaining comment
    const previousComment = await GitLab.getPreviousComment(
      mrIID,
      "SA GitLab Management System"
    );
    if (md.trim() === previousComment.trim()) {
      console.log("✅ Comment is the same as the previous one. Will not post.");
      return;
    }

    await GitLab.addComment(md);

    console.log("✅ Component size report completed.");
  } catch (error) {
    console.error(
      `❗️ ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
})();
