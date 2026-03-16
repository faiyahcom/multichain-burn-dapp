import FeeSettingsForm from "./form";

const FeeSettingsManagement = () => {
    return (
        <div className="relative flex w-full flex-col p-6">
            <h1 className="pt-4 pb-8 text-center text-3xl font-semibold">
                Revenue &amp; Fee Statistics
            </h1>

            <div className="flex justify-center">
                <FeeSettingsForm />
            </div>
        </div>
    );
};

export default FeeSettingsManagement;
