import CreateLaunchpadPoolForm from "./form";

const CreateLaunchpadPool = () => {
    return (
        <div className="p-6 flex flex-col w-full items-center">
            <h1 className="text-3xl font-semibold pt-4 pb-8">Create Launchpad</h1>
            <CreateLaunchpadPoolForm />
        </div>
    );
};

export default CreateLaunchpadPool;
