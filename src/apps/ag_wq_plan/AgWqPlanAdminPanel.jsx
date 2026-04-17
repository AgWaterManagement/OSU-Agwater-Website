import { secrets } from '../../secrets';
import AgWqplanAuthManager from '../../components/AgWqplanAuthManager';

export default function AgWqPlanAdminPanel() {
  return (
    <AgWqplanAuthManager
      apiBaseUrl="https://agwater.org:5556"
      apiKey={secrets.agwater_api_key}
      showAdmin={true}
    />
  );
}
