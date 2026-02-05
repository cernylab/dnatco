import React from "react";
import { ThingsAreHappeningImg } from "../../assets/images";

export class InProgressSpinner extends React.Component<{}> {
  render() {
    return (
      <img src={ThingsAreHappeningImg} className="animate-spin w-auto h-9" />
    );
  }
}
