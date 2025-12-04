import { useEffect, useState } from "react";
import { useSession } from "../../lib/auth/client";
import { useMigrateTemporaryCalculations } from "../../lib/storage/migrate";
import { hasTemporaryData } from "../../lib/storage/temporary";

/**
 * Component that handles migration of temporary calculations when user logs in
 * This should be included in the root layout or a component that's always rendered
 * Client-only component - doesn't run during SSR
 */
export function MigrationHandler() {
	const [isClient, setIsClient] = useState(false);

	// Ensure this only runs on the client
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Don't render anything during SSR
	if (!isClient) {
		return null;
	}

	return <MigrationHandlerClient />;
}

function MigrationHandlerClient() {
	const { data: session } = useSession();
	const isAuthenticated = !!session?.user;
	const { migrate, isMigrating } = useMigrateTemporaryCalculations({ enabled: isAuthenticated });
	const [hasMigrated, setHasMigrated] = useState(false);

	useEffect(() => {
		// Only migrate if:
		// 1. User is authenticated
		// 2. There's temporary data to migrate
		// 3. We haven't already migrated in this session
		if (isAuthenticated && !hasMigrated && !isMigrating && hasTemporaryData()) {
			migrate()
				.then((result) => {
					if (result.migrated > 0) {
						console.log(
							`Successfully migrated ${result.migrated} calculation(s) to your account`,
						);
						if (result.errors > 0) {
							console.warn(
								`Failed to migrate ${result.errors} calculation(s)`,
							);
						}
					}
					setHasMigrated(true);
				})
				.catch((error) => {
					console.error("Failed to migrate temporary calculations:", error);
				});
		}

		// Reset migration flag when user logs out
		if (!isAuthenticated) {
			setHasMigrated(false);
		}
	}, [isAuthenticated, hasMigrated, isMigrating, migrate]);

	return null; // This component doesn't render anything
}

