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
}

function wedgePolygon({ startDeg, endDeg }: WedgePolygonOptions): string {
  const toRad = (deg: number): number => ((deg - 90) * Math.PI) / 180;
  const pt = (deg: number): [number, number] => [
    50 + 50 * Math.cos(toRad(deg)),
    50 + 50 * Math.sin(toRad(deg)),
  ];

  const points: [number, number][] = [[50, 50]];
  const steps = Math.ceil((endDeg - startDeg) / 10);
  for (let i = 0; i <= steps; i++)
    points.push(pt(startDeg + ((endDeg - startDeg) * i) / steps));
  points.push([50, 50]);

  return (
    "polygon(" +
    points.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(", ") +
    ")"
  );
}

const MultipleSplitTokenImage: React.FC<Props> = ({
  imgs,
  labels,
  classNames,
}) => {
  const { common: _common, ...restClassNames } = classNames ?? {}; // ← add this
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
            ...restClassNames,
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
