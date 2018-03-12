import * as React from "react";
import { Config, ConfigEntry, InputType, str2InputType, getDataFromConfig } from "./ConfigApi";
import { applyEventToEntry, renderConfigPage } from "./ConfigWidgets";
import {
    Title, Label, Input, Control, Field, Select, Columns, Column, Button, Icon, Container,
    Card, CardHeader, CardContent, Tabs, TabList, Tab, TabLink, TextArea
} from "bloomer";
import { saveAs } from "file-saver";
import * as toastr from "toastr";

enum SelectedTab {
    PREVIEW,
    CONFIG_JSON,
    CONFIG_CPP
}

enum SelectedNavTab {
    EDIT,
    GENERATE
}
interface ConifgGeneratorAppState {
    config: Config;
    lastChange: number;
    selectedPanel: number;
    selectedItem: number;
    selectedTab: SelectedTab;
    selectedNavTab: SelectedNavTab;
}

export class ConifgGeneratorApp extends React.Component<{}, ConifgGeneratorAppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            config: {
                version: 0,
                title: "",
                panels: []
            },
            lastChange: Date.now(),
            selectedPanel: 0,
            selectedItem: 0,
            selectedTab: SelectedTab.PREVIEW,
            selectedNavTab: SelectedNavTab.EDIT
        };
    }
    redraw = () => {
        this.setState({ lastChange: Date.now() });
    }

    updateTitle = (event: React.FormEvent<HTMLInputElement>) => {
        const config = this.state.config;
        config.title = event.currentTarget.value;
        this.setState({ config });
    }

    renderInputTypeItems(currentType: InputType): any {
        const options = [];

        for (let t in InputType) {
            if (isNaN(Number(t))) {
                options.push(
                    <option key={"type" + t} value={InputType[t]} selected={InputType[t] === currentType}>{t}</option>
                );
            }
        }
        return options;
    }

    renderConfigMain(): any {
        return (
            <div>

                <Field >
                    <Label isSize="small">Title</Label>
                    <Control>
                        <Input isSize="small"
                            type="text"
                            value={"" + this.state.config.title}
                            onChange={this.updateTitle}
                        />
                    </Control>
                </Field>
            </div>
        );
    }

    renderConfigPanel = () => {
        return (
            <div>
                <Label isSize="small">Panel:</Label>
                {!this.state.config.title ? <p>Please provide a title.</p> :
                    <div>
                        <Field>
                            <Control>
                                {!this.state.config.panels.length ? undefined :
                                    <Select isSize="small"
                                        onChange={(event: React.FormEvent<HTMLInputElement>) => {
                                            this.setState({
                                                selectedPanel: Number.parseInt(event.currentTarget.value),
                                                selectedItem: 0
                                            });
                                            console.log("selected panel", event.currentTarget.value);

                                        }}>
                                        {this.state.config
                                            .panels.map((p, i) => <option value={i} selected={i === this.state.selectedPanel}>{p.title}</option>)}
                                    </Select>
                                }
                                <Button
                                    isSize="small"
                                    onClick={() => {
                                        this.state.config.panels.push({
                                            title: "Panel " + (this.state.config.panels.length + 1),
                                            entries: []
                                        });
                                        this.setState({ selectedPanel: this.state.config.panels.length - 1 });
                                    }}
                                ><Icon icon="plus" /></Button>
                            </Control>
                        </Field>

                        {!this.state.config.panels[this.state.selectedPanel] ? undefined :
                            <Field>
                                <Label isSize="small">Title:</Label>
                                <Control>
                                    <Input
                                        isSize="small"
                                        type="text"
                                        onChange={(event: React.FormEvent<HTMLInputElement>) => {
                                            this.state.config.panels[this.state.selectedPanel].title = event.currentTarget.value;
                                            this.redraw();
                                        }}
                                        value={this.state.config.panels[this.state.selectedPanel].title}
                                    />
                                </Control>
                            </Field>
                        }
                    </div>
                }
            </div>
        );
    }

    renderItemConfigDetail = (currentItem: ConfigEntry) => {
        return ([
            <Field>
                <Label isSize="small">Label:</Label>
                <Control>
                    <Input
                        isSize="small"
                        type="text"
                        onChange={(event: React.FormEvent<HTMLInputElement>) => {
                            currentItem.label = event.currentTarget.value;
                            this.redraw();
                        }}
                        value={currentItem.label}
                    />
                </Control>
            </Field>,
            <Field>
                <Label isSize="small">Type:</Label>
                <Control>
                    <Select
                        isSize="small"
                        onChange={(event: React.FormEvent<HTMLInputElement>) => {
                            console.log("selected type", event.currentTarget.value);
                            const newType = str2InputType(event.currentTarget.value);
                            this.state.config.panels[this.state.selectedPanel]
                                .entries[this.state.selectedItem].type = newType;
                            this.redraw();
                        }}>
                        {this.renderInputTypeItems(currentItem.type)}
                    </Select>
                </Control>
            </Field>,
            <Field>
                <Label isSize="small">Help text:</Label>
                <Control>
                    <Input
                        isSize="small"
                        type="text"
                        onChange={(event: React.FormEvent<HTMLInputElement>) => {
                            currentItem.help = event.currentTarget.value;
                            this.redraw();
                        }} value={this.state.config.panels[this.state.selectedPanel]
                            .entries[this.state.selectedItem].help}
                    />
                </Control>
            </Field>
        ]);
    }
    renderConfigItem = (currentItem: ConfigEntry): any => {
        return (
            <div>
                <Field>
                    <Label isSize="small">Item:</Label>
                    {this.state.config.panels.length === 0 ? <p>Please add a panel.</p> :
                        <Control>
                            {!currentItem ? undefined :
                                <Select isSize="small"
                                    onChange={(event: React.FormEvent<HTMLInputElement>) => {
                                        this.setState({ selectedItem: Number.parseInt(event.currentTarget.value) });
                                        console.log("selected item", event.currentTarget.value);

                                    }}>
                                    {this.state.config.panels[this.state.selectedPanel]
                                        .entries.map((e, i) => <option value={i} selected={i === this.state.selectedItem}>{e.label}</option>)}
                                </Select>}
                            <Button
                                isSize="small"
                                onClick={() => {
                                    this.state.config.panels[this.state.selectedPanel]
                                        .entries.push({
                                            label: "Item " + (this.state.config.panels[this.state.selectedPanel].entries.length + 1),
                                            help: "",
                                            type: InputType.NUMBER,
                                            value: ""
                                        });
                                    this.setState({ selectedItem: this.state.config.panels[this.state.selectedPanel].entries.length - 1 });
                                }}
                            ><Icon icon="plus" /></Button>
                        </Control>
                    }
                </Field>
                {!currentItem ? undefined : this.renderItemConfigDetail(currentItem)}
            </div>
        );
    }

    renderSaveButton = () => {
        return !this.state.config.panels.length ? undefined :
            (
                <div>
                    <Field isGrouped>
                        <Control>
                            <Button isColor="primary" onClick={() => {
                                const blob = new Blob([JSON.stringify(this.state.config)], { type: "text/plain;charset=utf-8" });
                                saveAs(blob, "config.json");
                            }} >
                                Download Code
                        </Button>
                        </Control>
                    </Field>
                </div>
            );
    }

    renderMainTabs = () => {
        return (<Tabs>
            <TabList>
                <Tab isActive={this.state.selectedTab === SelectedTab.PREVIEW} onClick={() => this.setState({ selectedTab: SelectedTab.PREVIEW })}>
                    <TabLink>
                        <Icon isSize="small"><span className="fa fa-eye" /></Icon>
                        <span>Preview</span>
                    </TabLink>
                </Tab>
                <Tab isActive={this.state.selectedTab === SelectedTab.CONFIG_JSON} onClick={() => this.setState({ selectedTab: SelectedTab.CONFIG_JSON })}>
                    <TabLink>
                        <Icon isSize="small"><span className="fa fa-edit" /></Icon>
                        <span>config.json</span>
                    </TabLink>
                </Tab>
                <Tab isActive={this.state.selectedTab === SelectedTab.CONFIG_CPP} onClick={() => this.setState({ selectedTab: SelectedTab.CONFIG_CPP })}>
                    <TabLink>
                        <Icon isSize="small"><span className="fa fa-code" /></Icon>
                        <span>Config.cpp</span>
                    </TabLink>
                </Tab>
            </TabList>
        </Tabs>);
    }

    renderJson = () => {
        return (
            <Field>
                {/* <Label></Label> */}
                <Control>
                    <TextArea value={JSON.stringify(this.state.config)} />
                </Control>
            </Field>
        );
    }

    generateCpp = (config: Config) => {
        return "TODO";
    }

    renderCpp = () => {
        return (
            <Field>
                {/* <Label></Label> */}
                <Control>
                    <TextArea value={this.generateCpp(this.state.config)} />
                </Control>
            </Field>
        );
    }

    onPreviewSave = () => {
        const data = getDataFromConfig(this.state.config);
        console.log(data);
        toastr.success("Saved.", "This was just simulated.");
    }

    render() {
        const currentItem = this.state.config.panels[this.state.selectedPanel]
            && this.state.config.panels[this.state.selectedPanel].entries[this.state.selectedItem];
        return <div>
            <Container>
                <Title size={4}>ESP Config Generator</Title>
                <Columns>
                    <Column isSize="1/4">
                        <Card>
                            <CardHeader>
                                <Tabs>
                                    <TabList>
                                        <Tab isActive={this.state.selectedNavTab === SelectedNavTab.EDIT} onClick={() => this.setState({ selectedNavTab: SelectedNavTab.EDIT })}>
                                            <TabLink>
                                                <Icon isSize="small"><span className="fa fa-cog" /></Icon>
                                                <span>Edit</span>
                                            </TabLink>
                                        </Tab>
                                        <Tab isActive={this.state.selectedNavTab === SelectedNavTab.GENERATE} onClick={() => this.setState({ selectedNavTab: SelectedNavTab.GENERATE })}>
                                            <TabLink>
                                                <Icon isSize="small"><span className="fa fa-play" /></Icon>
                                                <span>Generate</span>
                                            </TabLink>
                                        </Tab>
                                    </TabList>
                                </Tabs>
                            </CardHeader>
                            <CardContent>
                                {this.state.selectedNavTab === SelectedNavTab.EDIT ?
                                    <div>
                                        {this.renderConfigMain()}
                                        <hr />
                                        {this.renderConfigPanel()}
                                        <hr />
                                        {this.renderConfigItem(currentItem)}
                                    </div>
                                    : // else
                                    <div>
                                        {this.renderSaveButton()}
                                    </div>
                                }
                            </CardContent>
                        </Card>
                    </Column>
                    <Column isSize="3/4">
                        <Card>
                            <CardHeader>
                                {this.renderMainTabs()}
                            </CardHeader>
                            <CardContent style={{ overflow: "scroll" }}>
                                {this.state.selectedTab === SelectedTab.PREVIEW && renderConfigPage(this.state.config, this.onEntryChange, true, this.onPreviewSave)}
                                {this.state.selectedTab === SelectedTab.CONFIG_JSON && this.renderJson()}
                                {this.state.selectedTab === SelectedTab.CONFIG_CPP}
                            </CardContent>
                        </Card>
                    </Column>
                </Columns>
            </Container>
        </div >;
    }

    onEntryChange = (entry: ConfigEntry, event: React.FormEvent<HTMLInputElement>) => {
        applyEventToEntry(entry, event);
        this.redraw();
    }

}
