import AgWqplanAuthManager from '../../components/AgWqplanAuthManager';

export default function AgWqPlanAdminPanel() {
  return (
    <AgWqplanAuthManager
      apiBaseUrl="https://agwater.org:5556"
      apiKey="agwater-web-app"
      showAdmin={true}
    />
  );
}
