import CreateSwapPoolForm from './form'

type Props = {
    tokenFrom?: string;
    tokenTo?: string;
    amount?: string;
}

const CreateSwapPool = ({ tokenFrom, tokenTo, amount }: Props) => {
    return (
        <div className="p-6 flex flex-col w-full items-center">
            <h1 className='text-3xl font-semibold pt-4 pb-8'>CREATE SWAP POOL</h1>
            <CreateSwapPoolForm initialTokenBurn={tokenFrom} initialTokenReward={tokenTo} initialBudget={amount} />
        </div>
    )
}

export default CreateSwapPool