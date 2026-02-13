<?php

namespace BigBrotherJunkies\Data\Admin\Pages;

use BigBrotherJunkies\Data\Email\EmailSchema;
use BigBrotherJunkies\Data\Email\EmailService;

class EmailListsPage
{
    public const MENU_SLUG = 'bbjd-mailing';

    public function render(): void
    {
        global $wpdb;

        $listTable = EmailSchema::table(EmailSchema::TABLE_LISTS);
        $listSubTable = EmailSchema::table(EmailSchema::TABLE_LIST_SUBSCRIBERS);
        $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);

        // Check if viewing a specific list
        $viewList = sanitize_text_field($_GET['list'] ?? '');

        if ($viewList) {
            $this->renderListDetail($viewList);
            return;
        }

        // Get all lists with subscriber counts
        $lists = $wpdb->get_results(
            "SELECT l.*,
                    COUNT(CASE WHEN s.status = 'subscribed' THEN 1 END) as active_count,
                    COUNT(ls.subscriber_id) as total_count
             FROM {$listTable} l
             LEFT JOIN {$listSubTable} ls ON l.id = ls.list_id
             LEFT JOIN {$subTable} s ON ls.subscriber_id = s.id
             GROUP BY l.id
             ORDER BY l.created_at ASC"
        );
        ?>
        <div class="bbjd-admin">
            <div class="bbjd-p-6 bbjd-max-w-6xl">
                <h1 class="bbjd-text-3xl bbjd-font-bold bbjd-text-primary500 bbjd-mb-6">
                    Mailing Lists
                </h1>

                <div class="bbjd-bg-white bbjd-rounded-lg bbjd-shadow bbjd-overflow-hidden">
                    <table class="bbjd-w-full bbjd-text-sm">
                        <thead>
                            <tr class="bbjd-bg-gray-50 bbjd-border-b">
                                <th class="bbjd-text-left bbjd-px-6 bbjd-py-3 bbjd-font-medium bbjd-text-gray-700">List</th>
                                <th class="bbjd-text-left bbjd-px-6 bbjd-py-3 bbjd-font-medium bbjd-text-gray-700">Slug</th>
                                <th class="bbjd-text-center bbjd-px-6 bbjd-py-3 bbjd-font-medium bbjd-text-gray-700">Active Subs</th>
                                <th class="bbjd-text-center bbjd-px-6 bbjd-py-3 bbjd-font-medium bbjd-text-gray-700">Total</th>
                                <th class="bbjd-text-center bbjd-px-6 bbjd-py-3 bbjd-font-medium bbjd-text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($lists)): ?>
                                <tr><td colspan="5" class="bbjd-px-6 bbjd-py-8 bbjd-text-center bbjd-text-gray-500">No lists found. Tables may need migration.</td></tr>
                            <?php else: ?>
                                <?php foreach ($lists as $list): ?>
                                <tr class="bbjd-border-b hover:bbjd-bg-gray-50">
                                    <td class="bbjd-px-6 bbjd-py-3">
                                        <a href="<?php echo esc_url(add_query_arg(['page' => self::MENU_SLUG, 'list' => $list->slug], admin_url('admin.php'))); ?>"
                                           class="bbjd-text-primary500 bbjd-font-medium hover:bbjd-underline">
                                            <?php echo esc_html($list->name); ?>
                                        </a>
                                        <?php if ($list->description): ?>
                                            <p class="bbjd-text-xs bbjd-text-gray-500 bbjd-mt-0.5"><?php echo esc_html($list->description); ?></p>
                                        <?php endif; ?>
                                    </td>
                                    <td class="bbjd-px-6 bbjd-py-3 bbjd-font-mono bbjd-text-xs bbjd-text-gray-600"><?php echo esc_html($list->slug); ?></td>
                                    <td class="bbjd-px-6 bbjd-py-3 bbjd-text-center bbjd-font-semibold"><?php echo intval($list->active_count); ?></td>
                                    <td class="bbjd-px-6 bbjd-py-3 bbjd-text-center bbjd-text-gray-600"><?php echo intval($list->total_count); ?></td>
                                    <td class="bbjd-px-6 bbjd-py-3 bbjd-text-center">
                                        <?php if ($list->is_active): ?>
                                            <span class="bbjd-inline-block bbjd-px-2 bbjd-py-0.5 bbjd-text-xs bbjd-rounded-full bbjd-bg-green-100 bbjd-text-green-700">Active</span>
                                        <?php else: ?>
                                            <span class="bbjd-inline-block bbjd-px-2 bbjd-py-0.5 bbjd-text-xs bbjd-rounded-full bbjd-bg-gray-100 bbjd-text-gray-600">Inactive</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <?php
    }

    private function renderListDetail(string $listSlug): void
    {
        $service = new EmailService();
        $page = intval($_GET['paged'] ?? 1);
        $status = sanitize_text_field($_GET['status'] ?? '');
        $search = sanitize_text_field($_GET['s'] ?? '');

        $result = $service->getSubscribers($listSlug, [
            'page' => $page,
            'per_page' => 25,
            'status' => $status ?: null,
            'search' => $search ?: null,
        ]);

        $backUrl = add_query_arg(['page' => self::MENU_SLUG], admin_url('admin.php'));
        $baseUrl = add_query_arg(['page' => self::MENU_SLUG, 'list' => $listSlug], admin_url('admin.php'));
        ?>
        <div class="bbjd-admin">
            <div class="bbjd-p-6 bbjd-max-w-6xl">
                <div class="bbjd-mb-4">
                    <a href="<?php echo esc_url($backUrl); ?>" class="bbjd-text-primary500 bbjd-text-sm hover:bbjd-underline">&larr; Back to Lists</a>
                </div>

                <h1 class="bbjd-text-3xl bbjd-font-bold bbjd-text-primary500 bbjd-mb-2">
                    <?php echo esc_html(ucwords(str_replace('-', ' ', $listSlug))); ?>
                </h1>
                <p class="bbjd-text-gray-600 bbjd-mb-6"><?php echo intval($result['total']); ?> subscribers</p>

                <!-- Filters -->
                <div class="bbjd-flex bbjd-gap-3 bbjd-mb-4 bbjd-items-center">
                    <form method="get" class="bbjd-flex bbjd-gap-2 bbjd-items-center">
                        <input type="hidden" name="page" value="<?php echo esc_attr(self::MENU_SLUG); ?>">
                        <input type="hidden" name="list" value="<?php echo esc_attr($listSlug); ?>">
                        <input type="text" name="s" value="<?php echo esc_attr($search); ?>" placeholder="Search email..."
                               class="bbjd-px-3 bbjd-py-1.5 bbjd-border bbjd-border-gray-300 bbjd-rounded bbjd-text-sm" style="min-width:200px;">
                        <select name="status" class="bbjd-px-3 bbjd-py-1.5 bbjd-border bbjd-border-gray-300 bbjd-rounded bbjd-text-sm">
                            <option value="">All Statuses</option>
                            <option value="subscribed" <?php selected($status, 'subscribed'); ?>>Subscribed</option>
                            <option value="unconfirmed" <?php selected($status, 'unconfirmed'); ?>>Unconfirmed</option>
                            <option value="unsubscribed" <?php selected($status, 'unsubscribed'); ?>>Unsubscribed</option>
                            <option value="bounced" <?php selected($status, 'bounced'); ?>>Bounced</option>
                        </select>
                        <button type="submit" class="bbjd-bg-primary500 bbjd-text-white bbjd-px-3 bbjd-py-1.5 bbjd-rounded bbjd-text-sm">Filter</button>
                    </form>
                </div>

                <!-- Subscriber Table -->
                <div class="bbjd-bg-white bbjd-rounded-lg bbjd-shadow bbjd-overflow-hidden">
                    <table class="bbjd-w-full bbjd-text-sm">
                        <thead>
                            <tr class="bbjd-bg-gray-50 bbjd-border-b">
                                <th class="bbjd-text-left bbjd-px-6 bbjd-py-3 bbjd-font-medium bbjd-text-gray-700">Email</th>
                                <th class="bbjd-text-center bbjd-px-6 bbjd-py-3 bbjd-font-medium bbjd-text-gray-700">Status</th>
                                <th class="bbjd-text-left bbjd-px-6 bbjd-py-3 bbjd-font-medium bbjd-text-gray-700">Source</th>
                                <th class="bbjd-text-left bbjd-px-6 bbjd-py-3 bbjd-font-medium bbjd-text-gray-700">Subscribed</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($result['subscribers'])): ?>
                                <tr><td colspan="4" class="bbjd-px-6 bbjd-py-8 bbjd-text-center bbjd-text-gray-500">No subscribers found.</td></tr>
                            <?php else: ?>
                                <?php foreach ($result['subscribers'] as $sub): ?>
                                <tr class="bbjd-border-b">
                                    <td class="bbjd-px-6 bbjd-py-3 bbjd-font-mono bbjd-text-xs"><?php echo esc_html($sub['email']); ?></td>
                                    <td class="bbjd-px-6 bbjd-py-3 bbjd-text-center">
                                        <?php echo $this->statusBadge($sub['status']); ?>
                                    </td>
                                    <td class="bbjd-px-6 bbjd-py-3 bbjd-text-gray-600"><?php echo esc_html($sub['source'] ?? '-'); ?></td>
                                    <td class="bbjd-px-6 bbjd-py-3 bbjd-text-gray-600 bbjd-text-xs">
                                        <?php echo $sub['subscribed_at'] ? esc_html(date('M j, Y', strtotime($sub['subscribed_at']))) : '-'; ?>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <?php if ($result['total_pages'] > 1): ?>
                <div class="bbjd-flex bbjd-justify-center bbjd-gap-2 bbjd-mt-4">
                    <?php for ($i = 1; $i <= $result['total_pages']; $i++): ?>
                        <a href="<?php echo esc_url(add_query_arg('paged', $i, $baseUrl)); ?>"
                           class="bbjd-px-3 bbjd-py-1 bbjd-rounded bbjd-text-sm <?php echo $i === $page ? 'bbjd-bg-primary500 bbjd-text-white' : 'bbjd-bg-gray-100 bbjd-text-gray-700 hover:bbjd-bg-gray-200'; ?>">
                            <?php echo $i; ?>
                        </a>
                    <?php endfor; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }

    private function statusBadge(string $status): string
    {
        $colors = [
            'subscribed' => 'bbjd-bg-green-100 bbjd-text-green-700',
            'unconfirmed' => 'bbjd-bg-yellow-100 bbjd-text-yellow-700',
            'unsubscribed' => 'bbjd-bg-gray-100 bbjd-text-gray-600',
            'bounced' => 'bbjd-bg-red-100 bbjd-text-red-700',
        ];
        $colorClass = $colors[$status] ?? 'bbjd-bg-gray-100 bbjd-text-gray-600';
        return '<span class="bbjd-inline-block bbjd-px-2 bbjd-py-0.5 bbjd-text-xs bbjd-rounded-full ' . $colorClass . '">' . esc_html(ucfirst($status)) . '</span>';
    }
}
