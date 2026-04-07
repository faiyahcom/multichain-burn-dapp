import CreateSwapPoolForm from './form'

type Props = {
    tokenFrom?: string;
    tokenTo?: string;
    amount?: string;
}

const CreateSwapPool = ({ tokenFrom, tokenTo, amount }: Props) => {
    return (
        <div className="p-3 md:p-5 lg:p-6 xl:p-8 flex flex-col w-full items-center gap-4 md:gap-6 xl:gap-10 2xl:gap-17.5">
            <p className='text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold'>CREATE SWAP POOL</p>
            <CreateSwapPoolForm initialTokenBurn={tokenFrom} initialTokenReward={tokenTo} initialBudget={amount} />
        </div>
    )
}

export default CreateSwapPool