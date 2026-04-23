import CreateStakePoolForm from './form'

const CreateStakePool = () => {
    return (
        <div className="p-6 flex flex-col w-full items-center">
            <h1 className='text-3xl font-semibold pt-4 pb-8'>Create Staking Pool</h1>
            <CreateStakePoolForm />
        </div>
    )
}

export default CreateStakePool