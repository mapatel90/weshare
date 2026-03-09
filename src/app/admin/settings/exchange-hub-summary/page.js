import SettingsExchangeHubSummaryForm from "@/components/admin/setting/settingExchangeHubSummaryForm";
import React from "react";
import DynamicTitle from "@/components/common/DynamicTitle";

const page = () => {
  return (
    <>
      <DynamicTitle titleKey="settings.title" />
      <SettingsExchangeHubSummaryForm />
    </>
  );
};

export default page;
