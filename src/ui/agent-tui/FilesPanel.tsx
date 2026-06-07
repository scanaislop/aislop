import { Box, Text } from "ink";
import type { FileEntry } from "../../agents/session-state.js";

const diffStat = (file: FileEntry): string => {
	if (file.binary) return "binary";
	if (typeof file.additions === "number" || typeof file.deletions === "number") {
		return `+${file.additions ?? 0} -${file.deletions ?? 0}`;
	}
	return "changed";
};

export const FilesPanel = ({ files }: { files: FileEntry[] }) => {
	if (files.length === 0) return null;
	const shown = files.slice(-5);
	return (
		<Box flexDirection="column" paddingX={1}>
			<Text dimColor>Edited files</Text>
			{shown.map((file) => (
				<Text key={file.filePath} wrap="truncate-middle">
					<Text color="green">✓ </Text>
					{file.filePath} <Text dimColor>{diffStat(file)}</Text>
				</Text>
			))}
			{files.length > shown.length ? (
				<Text dimColor>+{files.length - shown.length} more</Text>
			) : null}
		</Box>
	);
};
