import { cn } from "@/lib/utils";
import TokenImage from "./token-image";

interface Props {
  imgs: string[];
  labels: string[];
  classNames?: React.ComponentProps<typeof TokenImage>["classNames"];
}

interface WedgePolygonOptions {
  startDeg: number;
  endDeg: number;
  size?: number;
}

function wedgePolygon({
  startDeg,
  endDeg,
  size = 124,
}: WedgePolygonOptions): string {
  const cx = size / 2,
    cy = size / 2,
    r = size / 2;
  const toRad = (deg: number): number => ((deg - 90) * Math.PI) / 180;
  const pt = (deg: number): [number, number] => [
    cx + r * Math.cos(toRad(deg)),
    cy + r * Math.sin(toRad(deg)),
  ];

  const points: [number, number][] = [[cx, cy]];
  const steps = Math.ceil((endDeg - startDeg) / 10);
  for (let i = 0; i <= steps; i++)
    points.push(pt(startDeg + ((endDeg - startDeg) * i) / steps));
  points.push([cx, cy]);

  return (
    "polygon(" +
    points
      .map(
        ([x, y]) =>
          `${((x / size) * 100).toFixed(2)}% ${((y / size) * 100).toFixed(2)}%`,
      )
      .join(", ") +
    ")"
  );
}

const MultipleSplitTokenImage: React.FC<Props> = ({
  imgs,
  labels,
  classNames,
}) => {
  const imgLabelGroups = imgs.map((img, index) => ({
    img,
    label: labels?.[index] ?? `Token ${index + 1}`,
  }));
  const sliceAngle = 360 / Math.max(imgLabelGroups.length, 1);

  return (
    <div
      className={cn(
        "relative size-8 shrink-0 overflow-hidden rounded-full",
        classNames?.common,
      )}
    >
      {imgLabelGroups.map(({ img, label }, index) => (
        <TokenImage
          key={index}
          src={img}
          alt={label}
          classNames={{
            common: cn(
              "absolute top-0 left-0 h-full w-full",
              classNames?.common,
            ),
            ...(!!classNames
              ? (() => {
                  const { common, ...rest } = classNames;
                  return rest;
                })()
              : {}),
          }}
          styles={{
            common: {
              clipPath: wedgePolygon({
                startDeg: index * sliceAngle,
                endDeg: (index + 1) * sliceAngle,
              }),
            },
          }}
        />
      ))}
    </div>
  );
};

export default MultipleSplitTokenImage;
