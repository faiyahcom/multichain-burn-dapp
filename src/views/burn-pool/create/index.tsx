import CreateBurnPoolForm from './form'

type Props = {}

const CreateBurnPool = ({}: Props) => {
    return (
        <div className="p-6 flex flex-col w-full items-center">
            <h1 className='text-3xl font-semibold pt-4 pb-8'>CREATE BURN POOL</h1>
            <CreateBurnPoolForm />
        </div>
    )
}

export default CreateBurnPool