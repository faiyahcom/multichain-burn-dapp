import CreateSwapPoolForm from './form'

type Props = {
    tokenFrom?: string;
    tokenTo?: string;
    amount?: string;
}

const CreateSwapPool = ({ tokenFrom, tokenTo, amount }: Props) => {
    return (
        <div className="p-6 flex flex-col w-full items-center gap-17.5">
            <p className='text-4xl font-semibold'>CREATE SWAP POOL</p>
            <CreateSwapPoolForm initialTokenBurn={tokenFrom} initialTokenReward={tokenTo} initialBudget={amount} />
        </div>
    )
}

export default CreateSwapPool