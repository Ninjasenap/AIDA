#!/bin/bash
# Run localtime migration once and clean up

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_SCRIPT="$SCRIPT_DIR/src/database/migrations/001-localtime.ts"

echo "========================================"
echo "AIDA: Localtime Migration"
echo "========================================"
echo ""
echo "This will update your database to use local time (CET/CEST)"
echo "instead of UTC for all timestamp operations."
echo ""
echo "Migration script: $MIGRATION_SCRIPT"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Running migration..."
echo "----------------------------------------"

# Run the migration
if bun run "$MIGRATION_SCRIPT"; then
    echo "----------------------------------------"
    echo "✅ Migration completed successfully!"
    echo ""

    # Delete the migration script
    echo "Cleaning up migration script..."
    rm "$MIGRATION_SCRIPT"
    echo "✅ Migration script deleted: $MIGRATION_SCRIPT"

    # Check if migrations directory is empty
    MIGRATIONS_DIR="$SCRIPT_DIR/src/database/migrations"
    if [ -d "$MIGRATIONS_DIR" ] && [ -z "$(ls -A "$MIGRATIONS_DIR")" ]; then
        echo "Removing empty migrations directory..."
        rmdir "$MIGRATIONS_DIR"
        echo "✅ Migrations directory removed: $MIGRATIONS_DIR"
    fi

    echo ""
    echo "========================================"
    echo "Migration complete and cleaned up!"
    echo "========================================"
    echo ""
    echo "Your database now uses local time (CET/CEST)."
    echo "All future timestamps will use Swedish local time."
    echo ""

    # Self-destruct this script
    echo "Removing this migration runner script..."
    rm -- "$0"
    echo "✅ Done! All migration files removed."

else
    echo "----------------------------------------"
    echo "❌ Migration failed!"
    echo ""
    echo "The migration script has been kept for debugging."
    echo "Check the error message above and try again."
    echo ""
    exit 1
fi
