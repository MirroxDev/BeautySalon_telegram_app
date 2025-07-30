import { Section, Cell, List } from "@telegram-apps/telegram-ui";
import type { FC } from "react";

import { Link } from "@/components/Link/Link.tsx";
import { Page } from "@/components/Page.tsx";
// import BookingCalendar from "../Test/BookingCalendar";

export const IndexPage: FC = () => {
  return (
    <Page back={false}>
      <List>
        <Section
          header="Features"
          footer="You can use these pages to learn more about features, provided by Telegram Mini Apps and other useful projects">
          {/* <BookingCalendar /> */}
        </Section>
        <Section
          header="Application Launch Data"
          footer="These pages help developer to learn more about current launch information">
          <Link to="/test">
            <Cell subtitle="User data, chat information, technical data">
              Test
            </Cell>
          </Link>
        </Section>
      </List>
    </Page>
  );
};
