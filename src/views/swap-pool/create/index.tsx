import CreateSwapPoolForm from './form'

type Props = {}

const CreateSwapPool = ({}: Props) => {
    return (
        <div className="p-6 flex flex-col w-full items-center">
            <h1 className='text-3xl font-semibold pt-4 pb-8'>CREATE SWAP POOL</h1>
            <CreateSwapPoolForm />
        </div>
    )
}

export default CreateSwapPool