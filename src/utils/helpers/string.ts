export const truncateString = ({
  str,
  left = 6,
  right = 4,
}: {
  str: string;
  left?: number;
  right?: number;
}) => {
  if (typeof str !== "string") {
    return str;
  }
  if (str.length <= left + right) {
    return str;
  }
  return `${str.slice(0, left)}...${str.slice(-right)}`;
};
