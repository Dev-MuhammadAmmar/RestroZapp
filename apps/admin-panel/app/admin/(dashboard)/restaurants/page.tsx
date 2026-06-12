import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/AdminShell";
import { getAdminSnapshot } from "@/lib/data";
import { ActionForm } from "@/components/ActionForm";
import { createRestaurantAction } from "../../actions";

export default async function RestaurantsPage() {
  const data = await getAdminSnapshot();
  return <>
    <PageHeader title="Restaurants" description="Manage restaurant accounts, plans, activation and cloud configuration." />
    <div className="panel">
      <div className="panel-title"><div><h2>Restaurant directory</h2><p>{data.restaurants.length} registered locations</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Code</th><th>Restaurant</th><th>Plan</th><th>Status</th><th>Backups</th><th /></tr></thead><tbody>
        {data.restaurants.map((restaurant: any) => <tr key={restaurant.id}><td><b>{restaurant.restaurant_code}</b></td><td>{restaurant.name}</td><td>{restaurant.plan}</td><td><StatusBadge value={restaurant.status} /></td><td>{restaurant.backup_enabled ? "Enabled" : "Disabled"}</td><td><Link className="table-link" href={`/admin/restaurants/${restaurant.id}`}>Manage</Link></td></tr>)}
      </tbody></table></div>
    </div>
    <div className="panel compact-panel">
      <div className="panel-title"><div><h2><Plus /> Create restaurant</h2><p>Creates the account, activation secret and initial cloud configuration.</p></div></div>
      <ActionForm className="form-grid form-grid-3" action={createRestaurantAction} submitLabel="Create restaurant" pendingLabel="Creating restaurant...">
        <label>Name<input name="name" required /></label><label>Restaurant code<input name="restaurantCode" placeholder="SRP-002" required /></label><label>Activation password<input type="password" name="activationPassword" minLength={6} required /></label>
        <label>Phone<input name="phone1" /></label><label className="span-2">Address<input name="address" /></label>
      </ActionForm>
    </div>
  </>;
}
