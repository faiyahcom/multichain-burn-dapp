import CreateBurnPoolForm from './form'

type Props = {}

const CreateBurnPool = ({}: Props) => {
    return (
        <div className="p-3 md:p-5 lg:p-6 xl:p-8 flex flex-col w-full items-center gap-4 md:gap-6 xl:gap-10 2xl:gap-17.5">
            <p className='text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold'>CREATE BURN POOL</p>
            <CreateBurnPoolForm />
        </div>
    )
}

export default CreateBurnPool