import GlowSummaryCard from "@/components/common/glow/summary-card";

const PairListGlowSummary = () => {
  const cards: { title: string; value: string }[] = [
    {
      title: "Total Volume",
      value: Number(123456789).toLocaleString("en-US"), // TODO: replace with real value
    },
    {
      title: "Total Participants",
      value: Number(123456789).toLocaleString("en-US"), // TODO: replace with real value
    },
    {
      title: "Total Pairs",
      value: Number(123456789).toLocaleString("en-US"), // TODO: replace with real value
    },
    {
      title: "Total Transactions",
      value: Number(123456789).toLocaleString("en-US"), // TODO: replace with real value
    },
  ];

  return (
    <div className="global-grid">
      {cards.map((card, index) => (
        <GlowSummaryCard key={index} {...card} variant="pair" />
      ))}
    </div>
  );
};

export default PairListGlowSummary;
