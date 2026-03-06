import CreateSwapPoolForm from "./form";

type Props = {};

const CreateSwapPool = ({}: Props) => {
  return (
    <div className="flex w-full flex-col items-center p-6">
      <h1 className="pt-4 pb-8 text-3xl font-semibold">CREATE SWAP POOL</h1>
      <CreateSwapPoolForm />
    </div>
  );
};

export default CreateSwapPool;
