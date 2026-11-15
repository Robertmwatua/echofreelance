/** Public programme previews approved for this school. IDs deliberately prevent other
 * tutors' private drafts from becoming public through a matching title.
 * These authored outlines are proposed roadmaps, not completed lessons or a confirmed syllabus.
 */
type ProgrammeRoadmap = { title: string; steps: string[]; feesPending: boolean; description?: string }
export const programmeRoadmaps: Record<string, ProgrammeRoadmap> = {
  "cmtx8ggne000111p692xalgn6": {
    "title": "3D animations",
    "steps": [
      "Navigate the 3D workspace and basic tools",
      "Model objects and organise a scene",
      "Apply materials, lighting and cameras",
      "Animate movement with keyframes and timing",
      "Render and review a short animation"
    ],
    "feesPending": false
  },
  "cmwfjdr2q0007cp11lrpg94cu": {
    "title": "AI for Productivity",
    "steps": [
      "Understand what AI tools can and cannot do",
      "Write clear prompts and check the results",
      "Use AI for research, drafting and organisation",
      "Protect private information and verify sources",
      "Design a repeatable productivity workflow"
    ],
    "feesPending": true,
    "description": "Explore artificial intelligence tools for productivity."
  },
  "cmwfjdr2q0005cp11fjqlg2l6": {
    "title": "Advanced Excel & Data Analytics",
    "steps": [
      "Review formulas and structure reliable datasets",
      "Clean, validate and transform spreadsheet data",
      "Analyse data with lookup functions and pivot tables",
      "Communicate findings through charts and dashboards",
      "Build an analysis workbook from a practical brief"
    ],
    "feesPending": true,
    "description": "Develop advanced spreadsheet and data analysis skills."
  },
  "cmwfjdr2q000acp11s4w4naa9": {
    "title": "Artificial Intelligence & Business Automation",
    "steps": [
      "Map a business process and identify repetitive work",
      "Explore AI capabilities and data requirements",
      "Connect tools and design an automation workflow",
      "Test outputs, privacy controls and failure handling",
      "Prototype and evaluate a business automation"
    ],
    "feesPending": true,
    "description": "Explore artificial intelligence and business automation."
  },
  "cmwfjdr2q000bcp11kh7eepoe": {
    "title": "Blockchain & Web3 Development",
    "steps": [
      "Understand distributed ledgers and transactions",
      "Explore wallets, keys and test networks",
      "Learn smart-contract and decentralised app basics",
      "Test contract behaviour and common security risks",
      "Prototype a small application on a test network"
    ],
    "feesPending": true,
    "description": "Explore blockchain and Web3 development."
  },
  "cmwfjdr2q0000cp11ev0po44e": {
    "title": "Certificate in Computer Applications",
    "steps": [
      "Computer basics and file organisation",
      "Documents and professional formatting",
      "Spreadsheets and everyday calculations",
      "Presentations and online communication",
      "Practical workplace application project"
    ],
    "feesPending": true,
    "description": "Build a foundation in practical computer applications."
  },
  "cmwfjdr2q0004cp11w9ew43xa": {
    "title": "Cloud Collaboration Tools",
    "steps": [
      "Understand cloud accounts and shared workspaces",
      "Organise files and manage sharing permissions",
      "Co-edit documents and coordinate changes",
      "Use calendars, meetings and team communication",
      "Build a small collaborative team workflow"
    ],
    "feesPending": true,
    "description": "Learn about tools for collaborating in the cloud."
  },
  "cmwfjdr2r000ecp11rfv4cy76": {
    "title": "Custom Software Development",
    "steps": [
      "Turn a practical problem into requirements",
      "Plan the interface, data model and architecture",
      "Build the core application in small steps",
      "Test behaviour, accessibility and security basics",
      "Deploy a prototype and document the handover"
    ],
    "feesPending": true,
    "description": "Develop skills in creating custom software solutions."
  },
  "cmtx29anp0004r0qryb0wnz82": {
    "title": "Cybersecurity",
    "steps": [
      "Review operating systems and network fundamentals",
      "Use an authorised practice lab and inspect traffic",
      "Investigate common weaknesses in a controlled environment",
      "Apply defensive controls and incident-response basics",
      "Document findings and a practical remediation plan"
    ],
    "feesPending": false
  },
  "cmwfjdr2q0009cp111zjgfwa4": {
    "title": "Cybersecurity & Digital Safety",
    "steps": [
      "Understand common digital threats",
      "Protect accounts, devices and personal information",
      "Recognise phishing and suspicious activity",
      "Practise safer browsing, backups and recovery",
      "Build a personal or small-team security checklist"
    ],
    "feesPending": true,
    "description": "Explore cybersecurity and safer digital practices."
  },
  "cmwfjdr2q0006cp1179vghbts": {
    "title": "Digital Marketing & Branding",
    "steps": [
      "Define an audience and a clear brand message",
      "Plan useful content across suitable channels",
      "Learn search, social and campaign fundamentals",
      "Read campaign metrics and improve the approach",
      "Produce a practical brand and campaign plan"
    ],
    "feesPending": true,
    "description": "Explore digital marketing and brand building."
  },
  "cmwfjdr2r000fcp11bokeuzv8": {
    "title": "Digital Transformation Strategy",
    "steps": [
      "Assess current processes and digital capabilities",
      "Identify customer and operational needs",
      "Compare tools, costs and implementation risks",
      "Plan adoption, governance and measures of success",
      "Present a phased transformation roadmap"
    ],
    "feesPending": true,
    "description": "Explore strategies for digital transformation."
  },
  "cmwfjdr2q0003cp11lj6anhit": {
    "title": "Internet & Email Professionalism",
    "steps": [
      "Browser basics and reliable online research",
      "Set up and organise an email workflow",
      "Write clear professional messages",
      "Recognise phishing and protect accounts",
      "Practise online communication and file sharing"
    ],
    "feesPending": true,
    "description": "Develop professional internet and email skills."
  },
  "cmwfjdr2q0002cp11o9myqtrc": {
    "title": "Microsoft Office Mastery",
    "steps": [
      "Organise documents and shared files",
      "Build and format Word documents",
      "Create Excel worksheets and formulas",
      "Design clear PowerPoint presentations",
      "Combine the tools in a workplace project"
    ],
    "feesPending": true,
    "description": "Develop practical skills using Microsoft Office applications."
  },
  "cmwfjdr2q000ccp11z99tl7bg": {
    "title": "Quantum Computing & Algorithms",
    "steps": [
      "Review the mathematics needed for the track",
      "Explore qubits, gates and measurement",
      "Build simple circuits with a simulator",
      "Work through introductory quantum algorithms",
      "Explain results and the limits of the simulation"
    ],
    "feesPending": true,
    "description": "Explore quantum computing and quantum algorithms."
  },
  "cmwfjdr2q0008cp11ykzhr56h": {
    "title": "Remote Work Systems",
    "steps": [
      "Set up a secure and organised remote workspace",
      "Manage tasks, time and asynchronous communication",
      "Collaborate using shared files and meetings",
      "Document workflows and protect team information",
      "Practise a complete remote project handover"
    ],
    "feesPending": true,
    "description": "Develop skills for working effectively in remote environments."
  },
  "cmwfjdr2r000dcp11n78f7kzq": {
    "title": "Sustainable Technology & Green IT",
    "steps": [
      "Understand environmental impacts of technology",
      "Evaluate device lifecycles, reuse and e-waste",
      "Explore energy-aware computing and infrastructure",
      "Identify practical sustainability improvements",
      "Create a measurable green IT improvement plan"
    ],
    "feesPending": true,
    "description": "Explore sustainable technology and green computing."
  },
  "cmwfjdr2q0001cp11k1qxdjq0": {
    "title": "Typing Speed & Accuracy",
    "steps": [
      "Keyboard layout and comfortable technique",
      "Accuracy drills and common key patterns",
      "Punctuation, numbers and document entry",
      "Timed practice and error review",
      "Track progress with a practical typing exercise"
    ],
    "feesPending": true,
    "description": "Develop typing speed and accuracy."
  }
}
export const publicProgrammeIds = Object.keys(programmeRoadmaps)
