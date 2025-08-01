import type { FC } from "react";

import { Page } from "@/components/Page.tsx";
import BookingCalendar from "../../components/BookingCalendar";
// import BookingCalendar from "../Test/BookingCalendar";

export const IndexPage: FC = () => {
  return (
    <Page back={false}>
        <BookingCalendar />
      {/* <List>
        <Section
          header="Features"
          footer="You can use these pages to learn more about features, provided by Telegram Mini Apps and other useful projects">
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
      </List> */}
    </Page>
  );
};
