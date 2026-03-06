export const convertArrayToStringParam = ({ array }: { array?: unknown[] }) => {
  if (!array) return undefined;
  if (array.length === 0) return undefined;
  return array.join(",");
};
