
const buildFileTree = (entries) => {
  const root = [];
  const folders = new Map();

  const files = entries
    .filter((entry) => entry.type === "blob")
    .sort((a, b) => a.path.localeCompare(b.path));

  files.forEach((entry) => {
    const parts = entry.path.split("/");
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath
        ? `${currentPath}/${part}`
        : part;

      const isFile = index === parts.length - 1;

      if (isFile) {
        currentLevel.push({
          id: currentPath,
          name: part,
          type: "file",
          path: entry.path,
          sha: entry.sha,
          size: entry.size,
        });
      } else {
        let folder = folders.get(currentPath);

        if (!folder) {
          folder = {
            id: currentPath,
            name: part,
            type: "folder",
            children: [],
          };

          folders.set(currentPath, folder);
          currentLevel.push(folder);
        }

        currentLevel = folder.children;
      }
    });
  });

  return root;
};

module.exports = buildFileTree;
