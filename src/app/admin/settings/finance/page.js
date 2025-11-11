import SettingsFinanceForm from "@/components/setting/settingsFinanceForm";
import React from "react";
import DynamicTitle from "@/components/common/DynamicTitle";

const page = () => {
  return (
    <>
      <DynamicTitle titleKey="settings.title" />
      <SettingsFinanceForm />
    </>
  );
};

export default page;
