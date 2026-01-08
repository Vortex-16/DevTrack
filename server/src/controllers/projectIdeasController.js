/**
 * Project Ideas Controller
 * Generates AI-powered project ideas based on user's skills
 */

const { getGroqService } = require("../services/groqService");
const { collections } = require("../config/firebase");
const { APIError } = require("../middleware/errorHandler");

/**
 * Generate personalized project ideas
 * POST /api/project-ideas/generate
 */
const generateIdeas = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { difficulty = "intermediate" } = req.body;

    // Validate difficulty
    const validDifficulties = ["beginner", "intermediate", "advanced"];
    if (!validDifficulties.includes(difficulty)) {
      throw new APIError("Invalid difficulty level", 400);
    }

    console.log(
      `🎯 Generating project ideas for user ${userId} (${difficulty})`
    );

    // 1. Fetch user's learning logs to extract skills (tags)
    const logsSnapshot = await collections
      .logs()
      .where("uid", "==", userId)
      .limit(100)
      .get();

    const tagCounts = {};
    logsSnapshot.docs.forEach((doc) => {
      const log = doc.data();
      (log.tags || []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by frequency
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    // 2. Fetch user's projects to extract technologies
    const projectsSnapshot = await collections
      .projects()
      .where("uid", "==", userId)
      .limit(50)
      .get();

    const techCounts = {};
    const projectTypes = [];

    projectsSnapshot.docs.forEach((doc) => {
      const project = doc.data();

      // Extract technologies
      (project.technologies || []).forEach((tech) => {
        const techName = typeof tech === "string" ? tech : tech?.name;
        if (techName) {
          techCounts[techName] = (techCounts[techName] || 0) + 1;
        }
      });

      // Categorize project types based on technologies
      const techs = (project.technologies || []).map((t) =>
        (typeof t === "string" ? t : t?.name || "").toLowerCase()
      );

      if (
        techs.some((t) => ["react", "vue", "angular", "next.js"].includes(t))
      ) {
        if (!projectTypes.includes("Web App")) projectTypes.push("Web App");
      }
      if (
        techs.some((t) =>
          ["express", "fastapi", "django", "node.js"].includes(t)
        )
      ) {
        if (!projectTypes.includes("Backend/API"))
          projectTypes.push("Backend/API");
      }
      if (
        techs.some((t) =>
          ["flutter", "react native", "swift", "kotlin"].includes(t)
        )
      ) {
        if (!projectTypes.includes("Mobile App"))
          projectTypes.push("Mobile App");
      }
    });

    const sortedTechs = Object.entries(techCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tech]) => tech);

    // 3. Build skill profile
    const allSkills = [...new Set([...sortedTags, ...sortedTechs])];
    const skillProfile = {
      primarySkills: allSkills.slice(0, 8), // Top 8 skills
      recentSkills: sortedTags.slice(0, 5), // Recent learning focus
      projectTypes: projectTypes.length > 0 ? projectTypes : ["General"],
    };

    console.log("📊 Skill profile:", skillProfile);

    // 4. Generate ideas using AI
    const groqService = getGroqService();
    const result = await groqService.generateProjectIdeas(
      skillProfile,
      difficulty
    );

    if (!result.success) {
      throw new APIError(result.error || "Failed to generate ideas", 500);
    }

    res.status(200).json({
      success: true,
      data: {
        ideas: result.ideas,
        skillProfile: {
          topSkills: skillProfile.primarySkills,
          projectTypes: skillProfile.projectTypes,
        },
      },
    });
  } catch (error) {
    console.error("Generate ideas error:", error);
    next(error);
  }
};

module.exports = {
  generateIdeas,
};
