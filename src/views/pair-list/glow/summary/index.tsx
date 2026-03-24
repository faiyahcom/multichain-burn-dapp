import GlowContainer from "@/components/common/glow/container";

const PairListGlowSummary = () => {
  const cards: PairListGlowSummaryCardProps[] = [
    {
      title: "Total Volume",
      value: Number(123456789).toLocaleString("en-US"), // TODO: replace with real value
      demoImg: "/images/pair-summary/pair-summary-1.svg",
    },
    {
      title: "Total Participants",
      value: Number(123456789).toLocaleString("en-US"), // TODO: replace with real value
      demoImg: "/images/pair-summary/pair-summary-2.svg",
    },
    {
      title: "Total Pairs",
      value: Number(123456789).toLocaleString("en-US"), // TODO: replace with real value
      demoImg: "/images/pair-summary/pair-summary-3.svg",
    },
    {
      title: "Total Transactions",
      value: Number(123456789).toLocaleString("en-US"), // TODO: replace with real value
      demoImg: "/images/pair-summary/pair-summary-4.svg",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
      {cards.map((card, index) => (
        <PairListGlowSummaryCard key={index} {...card} />
      ))}
    </div>
  );
};

export default PairListGlowSummary;

interface PairListGlowSummaryCardProps {
  title: string;
  value: string;
  demoImg: string;
}

const PairListGlowSummaryCard: React.FC<PairListGlowSummaryCardProps> = ({
  title,
  value,
  demoImg,
}) => {
  return (
    <GlowContainer variant="pair" className="space-y-3 p-3 xl:space-y-6 xl:p-6">
      <p className="text-xl font-semibold md:text-28px">{title}</p>
      <p className="text-right text-2xl font-semibold md:text-3xl">{value}</p>
      <img
        src={demoImg}
        alt={title}
        className="h-22.5 w-full object-contain object-bottom"
      />
    </GlowContainer>
  );
};
