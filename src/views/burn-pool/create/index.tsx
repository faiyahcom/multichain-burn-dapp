import CreateBurnPoolForm from "./form";

type Props = {};

const CreateBurnPool = ({}: Props) => {
  return (
    <div className="flex w-full flex-col items-center p-6">
      <h1 className="pt-4 pb-8 text-3xl font-semibold">CREATE BURN POOL</h1>
      <CreateBurnPoolForm />
    </div>
  );
};

export default CreateBurnPool;
